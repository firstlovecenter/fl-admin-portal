/**
 * Reply-language plumbing for the AI Assistant chat.
 *
 * Extracted from `assistant-resolvers.ts` so these pure functions can be tested
 * without importing the resolver, which transitively initialises `secrets.ts`,
 * the LLM clients, and `neo4j-driver`.
 *
 * The load-bearing constraint: `language` arrives from the client and is
 * interpolated into a system prompt, so it MUST be matched against a closed set
 * before it can reach the model. An arbitrary string here is a prompt-injection
 * vector.
 */

// Closed set, mirroring SUPPORTED_LANGUAGES in web-react-ts/src/lib/i18n.ts.
//
// A Map, deliberately not an object literal: an object lookup walks the
// prototype chain, so `CHAT_LANGUAGES['constructor']` returns the Object
// constructor and `['__proto__']` an object — both truthy, so `?? default`
// would NOT catch them and the value would be template-interpolated straight
// into the system prompt. A Map has no inherited keys, so a miss is a miss.
const CHAT_LANGUAGES = new Map<string, string>([
  ['en', 'English'],
  ['fr', 'French'],
  ['es', 'Spanish'],
  ['pt', 'Portuguese'],
  ['de', 'German'],
])

export const DEFAULT_CHAT_LANGUAGE = 'English'

// Longest legitimate value is a BCP 47 tag like 'pt-BR'; the cap stops a
// multi-kilobyte body from being split and lower-cased for nothing.
const MAX_LANGUAGE_TAG_CHARS = 35

export const resolveChatLanguage = (raw?: string | null): string => {
  if (!raw) return DEFAULT_CHAT_LANGUAGE
  // i18next's `load: 'languageOnly'` hands back 'fr', but a stored preference
  // or navigator value can still arrive region-tagged ('pt-BR').
  const subtag = raw
    .slice(0, MAX_LANGUAGE_TAG_CHARS)
    .trim()
    .split('-')[0]
    .toLowerCase()
  return CHAT_LANGUAGES.get(subtag) ?? DEFAULT_CHAT_LANGUAGE
}

/**
 * Reply-language block for the chat system prompt.
 *
 * Returns `''` for English, and the caller splices it in with no surrounding
 * whitespace, so an English caller's prompt is unchanged by *this block*. The
 * non-English form opens with a blank line and carries no trailing newline, so
 * it drops into the template without shifting anything around it.
 * `assistant-language.test.ts` pins the empty case and
 * `assistant-prompt.test.ts` pins the assembled prompt.
 *
 * Note this is NOT a claim that the English prompt is byte-identical to the
 * pre-feature version — it deliberately is not, because the empty-retrieval
 * escape hatch and the `QUOTE IT VERBATIM` cross-reference apply to English
 * callers too. An earlier version of this comment claimed byte-identity (and a
 * prompt-cache benefit; there is no prompt cache) and was wrong on both counts.
 *
 * The three guards below exist because translating a quotation is a
 * misattribution risk, not merely a quality one — a French sentence in quote
 * marks over Prophet's name is words he never wrote:
 *
 *  - translate only from the passages supplied in THIS turn (never from
 *    conversation history, whose source is absent from this turn's retrieval
 *    block and therefore absent from the stored citations);
 *  - never reconstruct a quote from memory;
 *  - translate scripture *references* but not verse *text*, because the
 *    supplied verse carries a named English translation that the stored
 *    citation asserts.
 */
export const chatLanguageGuidance = (language: string): string => {
  if (language === DEFAULT_CHAT_LANGUAGE) return ''
  return `

LANGUAGE (HARD constraint — overrides the quoting rules above where they conflict):
- Write your ENTIRE reply in ${language}. Every sentence — the pastoral
  opening, the advice, the prayer prompt, the "read further" suggestion, and
  any clarifying question.
- TRANSLATE the supplied passages into ${language} when you quote them, and
  keep them inside double quotes as usual. Translate faithfully and
  conservatively: convey exactly what the passage says, invent nothing, and do
  not soften or embellish.
- Quote ONLY from the passages supplied in THIS turn. The supplied passages are
  the ONLY thing you may translate from — never reconstruct a quote from
  memory, and never translate or re-quote a quotation that appears earlier in
  this conversation, because its source is not in this turn's retrieval block.
  To refer back to an earlier quotation, paraphrase it WITHOUT quotation marks
  and WITHOUT a citation.
- Mark a translated quotation as translated in its citation, so the leader
  knows they are reading a rendering rather than Prophet's published wording.
  Use the ${language} word for "translated" in parentheses after the citation.
- Keep BOOK TITLES in their published English form (*Loyalty And Disloyalty*,
  *Church Growth*) — that is how the leader will find them.
- For scripture, translate only the BOOK NAME and keep the chapter:verse
  numbering, using the book names a ${language}-speaking reader expects (e.g.
  "Jean 3:16"). Do NOT render the verse text in ${language}: the supplied verse
  carries a specific named English translation, so paraphrase its sense in your
  own words instead of presenting a translated wording as if it were that
  translation.`
}

/**
 * The thread title shows in the chat-history sidebar, so it follows the
 * caller's language too. Appends nothing for English.
 */
export const titleLanguageGuidance = (language: string): string =>
  language === DEFAULT_CHAT_LANGUAGE
    ? ''
    : `\n- Write the title in ${language}.`

/**
 * Shown when the Anthropic call fails outright, so a French leader does not get
 * an English error on an otherwise-French screen.
 *
 * Keyed by the resolved language *name* rather than the subtag because that is
 * what `resolveChatLanguage` returns. Also a Map, for the same prototype-chain
 * reason as CHAT_LANGUAGES.
 */
const CHAT_FAILURE_FALLBACK = new Map<string, string>([
  [
    'English',
    "I couldn't draft a reply just now. Try rephrasing the question, or check back in a moment.",
  ],
  [
    'French',
    "Je n'ai pas pu rédiger de réponse pour le moment. Reformulez votre question ou réessayez dans un instant.",
  ],
  [
    'Spanish',
    'No pude redactar una respuesta en este momento. Reformule la pregunta o vuelva a intentarlo en un momento.',
  ],
  [
    'Portuguese',
    'Não consegui redigir uma resposta neste momento. Reformule a pergunta ou tente novamente daqui a pouco.',
  ],
  [
    'German',
    'Ich konnte gerade keine Antwort verfassen. Formulieren Sie die Frage um oder versuchen Sie es gleich noch einmal.',
  ],
])

export const chatFailureFallback = (language: string): string =>
  CHAT_FAILURE_FALLBACK.get(language) ??
  (CHAT_FAILURE_FALLBACK.get(DEFAULT_CHAT_LANGUAGE) as string)

/**
 * System prompt for the retrieval-retry translation call.
 *
 * Retrieval embeds the leader's question with `text-embedding-3-small` and
 * queries a vector index built over an ENGLISH corpus of Prophet's books, with
 * a hard `score > 0.30` floor. The v3 embedding models are multilingual enough
 * that a French question often clears that floor — so we do NOT translate every
 * query. We translate and retry only when the first search comes back empty,
 * which costs nothing in the common case and pays only where the alternative is
 * an empty retrieval block.
 *
 * Empty retrieval is the state that actually matters: with no passages, the
 * prompt's "always suggest further reading" and "never cite anything outside
 * the retrieval block" rules cannot both be satisfied, and the cheapest way out
 * for the model is a fabricated quotation.
 */
export const QUERY_TRANSLATION_SYSTEM_PROMPT = `You translate a church leader's question into English so it can be matched against an English corpus.

Rules:
- Output ONLY the English translation. No preamble, no quotes, no explanation.
- Translate the meaning, not word-for-word. Keep it a question.
- Preserve church-specific vocabulary as-is: Bacenta, Governorship, Council, Stream, Campus, Bishop, Constituency.
- If the text is already English, output it unchanged.`
