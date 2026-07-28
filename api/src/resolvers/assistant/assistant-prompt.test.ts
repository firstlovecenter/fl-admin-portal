/**
 * Prompt-assembly tests for the AI Assistant chat.
 *
 * These exist because `assistant-language.test.ts` pins the language *helpers*
 * and that turned out not to be enough. The first version of this feature
 * spliced the language block in as `${chatLevelGuidance(x)}\n${chatLanguageGuidance(y)}`,
 * which added a newline to the English prompt even though the block was empty.
 * Every helper test stayed green — the defect was in the template, not the
 * helper. So the assertions below are on the assembled prompt.
 *
 * Note what is deliberately NOT asserted: byte-identity with the pre-feature
 * English prompt. That property was abandoned on purpose — the empty-retrieval
 * escape hatch and the `QUOTE IT VERBATIM` cross-reference are improvements that
 * should reach English callers too. What IS pinned is that the *language* block
 * contributes exactly nothing for English, which is the part that was buggy.
 */
import {
  buildChatSystemPrompt,
  buildTitleSystemPrompt,
} from './assistant-resolvers'
import { chatLanguageGuidance } from './assistant-language'

describe('buildChatSystemPrompt — the language block splice', () => {
  it('adds nothing at all for English', () => {
    // The regression that motivated this file. `fr` must equal `en` plus the
    // block and not one byte more — no stray newline, no whitespace drift.
    const en = buildChatSystemPrompt('Bacenta', 'English')
    const fr = buildChatSystemPrompt('Bacenta', 'French')
    const block = chatLanguageGuidance('French')

    expect(block.length).toBeGreaterThan(0)
    expect(fr).toHaveLength(en.length + block.length)
    expect(fr.replace(block, '')).toBe(en)
  })

  it('leaves exactly one blank line before the founder paragraph', () => {
    // The specific shape the stray newline broke: level guidance, blank line,
    // "The founder…". The bug produced a third newline. Asserted on the
    // separator itself rather than on the preceding sentence, which varies by
    // church level.
    const en = buildChatSystemPrompt('Bacenta', 'English')
    const at = en.indexOf('The founder of the church is')
    expect(at).toBeGreaterThan(0)
    expect(en.slice(at - 3, at)).toBe('.\n\n')
  })

  it('never leaves three consecutive newlines anywhere, in any language', () => {
    ;['English', 'French', 'Spanish', 'Portuguese', 'German'].forEach(
      (language) => {
        const prompt = buildChatSystemPrompt('Bacenta', language)
        expect(prompt).not.toMatch(/\n{3}/)
      }
    )
  })
})

describe('buildChatSystemPrompt — rule ordering', () => {
  it('places the LANGUAGE block after the QUOTE IT VERBATIM rule it overrides', () => {
    // Two direct, conflicting instructions: translate the quote vs. quote it
    // verbatim. Ordering alone is not a guarantee, which is why the verbatim
    // rule also cross-references the block — but a LANGUAGE block placed
    // *before* the rule is the worst case, so it is pinned.
    const fr = buildChatSystemPrompt('Bacenta', 'French')
    expect(fr.indexOf('LANGUAGE (HARD constraint')).toBeGreaterThan(
      fr.indexOf('QUOTE IT VERBATIM')
    )
  })

  it('cross-references the language block from the verbatim rule', () => {
    const fr = buildChatSystemPrompt('Bacenta', 'French')
    expect(fr).toContain(
      'QUOTE IT VERBATIM (subject to the LANGUAGE block below, if present)'
    )
  })
})

describe('buildChatSystemPrompt — the empty-retrieval escape hatch', () => {
  // With no passages retrieved, "always suggest further reading" + "never cite
  // outside the retrieval block" + "never invent quotes" cannot all hold, and
  // the cheapest way out for the model is a fabricated Prophet quote. The escape
  // hatch gives that state a defined resolution. It is language-independent —
  // an English question with no good match hits it too.
  it('is present in every language, not just the translated ones', () => {
    ;['English', 'French', 'Spanish', 'Portuguese', 'German'].forEach(
      (language) => {
        const prompt = buildChatSystemPrompt('Bacenta', language)
        expect(prompt).toContain('contains NO passages')
        expect(prompt).toMatch(/SKIP the "read further" suggestion/)
        expect(prompt).toMatch(
          /Never fill an empty retrieval block from memory/
        )
      }
    )
  })

  it('still requires the prayer prompt when retrieval is empty', () => {
    // The prayer prompt is unconditional; only the read-further suggestion is
    // waived. A rewrite that drops this distinction should fail here.
    const en = buildChatSystemPrompt('Bacenta', 'English')
    expect(en).toContain('Still end with the prayer prompt')
    expect(en).toContain('Skip the prayer prompt. It is always mandatory.')
  })

  it('no longer states the read-further rule as unconditional', () => {
    // The old wording ("both are mandatory") contradicted the escape hatch two
    // lines later.
    const en = buildChatSystemPrompt('Bacenta', 'English')
    expect(en).not.toContain('both are mandatory')
  })
})

describe('buildChatSystemPrompt — level guidance is unaffected', () => {
  it.each([
    ['Bacenta', 'BACENTA LEADER'],
    ['Governorship', 'GOVERNOR'],
    ['Council', 'COUNCIL Bishop'],
  ])(
    'still frames %s correctly alongside a language block',
    (level, marker) => {
      expect(buildChatSystemPrompt(level, 'French')).toContain(marker)
      expect(buildChatSystemPrompt(level, 'English')).toContain(marker)
    }
  )

  it('handles a null church level', () => {
    expect(buildChatSystemPrompt(null, 'German')).toContain('higher-level')
  })
})

describe('buildTitleSystemPrompt', () => {
  it('appends nothing for English', () => {
    // Unlike the chat prompt, the language guidance appends at the very end of
    // the last rule, so English is unchanged apart from the UNTITLED sentinel.
    const en = buildTitleSystemPrompt('English')
    expect(en.endsWith('return the single word UNTITLED.')).toBe(true)
  })

  it('uses a language-neutral sentinel rather than an English title', () => {
    // The old rule told the model to emit the literal "New conversation", which
    // was then persisted — so a French leader saw an English title in the
    // sidebar and the frontend's translated fallback was dead code.
    ;['English', 'French', 'German'].forEach((language) => {
      const prompt = buildTitleSystemPrompt(language)
      expect(prompt).toContain('UNTITLED')
      expect(prompt).not.toContain('New conversation')
    })
  })

  it('appends the language rule for other languages', () => {
    const de = buildTitleSystemPrompt('German')
    expect(de).toContain('- Write the title in German.')
    expect(de).toHaveLength(
      buildTitleSystemPrompt('English').length +
        '\n- Write the title in German.'.length
    )
  })

  it('keeps the max_tokens: 60 budget realistic', () => {
    // A 4-7 word title runs ~15-30 tokens even with less efficient non-English
    // tokenization, so 60 has headroom. This pins the *instruction* that keeps
    // it short, since that is what makes the budget safe.
    ;['English', 'German', 'Portuguese'].forEach((language) => {
      expect(buildTitleSystemPrompt(language)).toContain('4–7 word')
    })
  })
})
