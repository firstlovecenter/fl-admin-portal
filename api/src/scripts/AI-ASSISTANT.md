# AI Assistant — Ingestion + Manual Tip Generation

End-to-end guide for setting up the Phase 1 AI Assistant locally and in dev.

```
0. Add API keys to AWS Secrets Manager   (one-time, manual)
1. Create vector indexes in Neo4j        (one-time, per-environment)
2. Ingest a Bible translation            (KJV first, then WEB)
3. Ingest a founder's book               (PDF or EPUB)
4. Preview a tip for one church          (offline, single-shot)
5. Run the full Lambda                   (batch, all churches)
```

All scripts live under `api/src/scripts/`. Run them from the repo root with `node`.

---

## 0. AWS Secrets Manager

Add two keys to the `dev/fl-admin-portal` and `prod/fl-admin-portal` secret bundles:

| Key | Where to get it |
| --- | --- |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys — only needs `embeddings.create` scope. |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |

The scripts and Lambda both call `loadSecrets()` — never `process.env.X` directly. Setting these keys in `.env` works only as a local-dev fallback; in Lambda the env-var path is disabled.

> Quick check: `node -e "require('./api/src/functions/background/service-graph-aggregator/secrets.js').loadSecrets().then(s => console.log(Object.keys(s)))"` — both keys should appear.

---

## 1. Create the vector indexes (per-environment)

Already done on **dev**. To run against any environment:

```bash
node api/src/scripts/setup-vector-indexes.js
```

The script is idempotent — it uses `IF NOT EXISTS` everywhere. It creates:

- `bookPassageEmbedding` and `verseEmbedding` (vector indexes, 1536 dims, cosine)
- 5 uniqueness constraints (`weekly_tip_id`, `book_id`, `book_chapter_id`, `book_passage_id`, `verse_id`)

For **production**, this is tracked separately in [SYN-116](https://codefoundry.atlassian.net/browse/SYN-116). Don't run it against prod from a developer machine — the ticket assignee handles that.

---

## 2. Ingest a Bible translation

The script expects a **flat JSON array** of verse objects. Each record needs:

```json
{
  "book": "Genesis",
  "abbreviation": "GEN",
  "chapter": 1,
  "verse": 1,
  "text": "In the beginning God created the heaven and the earth."
}
```

### Where to get the JSON

KJV and WEB are both public-domain. Two reliable sources:

- **scrollmapper/bible_databases** — https://github.com/scrollmapper/bible_databases/tree/master/formats/json
  - Files: `kjv.json`, `web.json` (need light reshaping; see jq snippet below)
- **aruljohn/Bible-kjv** — https://github.com/aruljohn/Bible-kjv
  - Per-book JSON; concatenate with `jq -s 'add'` if you go this route

If your source uses a nested structure (book → chapter → verse), reshape with `jq`:

```bash
# Example: scrollmapper kjv.json (table-style: {b, c, v, t}) → flat array
jq -r '. as $rows
  | $rows[]
  | { book: (.b | tostring), abbreviation: (.b | tostring), chapter: .c, verse: .v, text: .t }' \
  kjv.json > kjv-flat.json
```

(You'll want a `book` → name and `abbreviation` → 3-letter-code mapping for prettier ids — `GEN`, `EXO`, etc. Easiest: download the metadata from the same repo and join.)

### Ingest it

```bash
# KJV first — it's the more familiar reference for the Ghanaian Pentecostal
# context and the one tips will lean on most.
node api/src/scripts/ingest-bible.js \
  --translation KJV \
  --input ./bibles/kjv-flat.json

# Then WEB (modern English), useful when a leader needs a more accessible quote.
node api/src/scripts/ingest-bible.js \
  --translation WEB \
  --input ./bibles/web-flat.json
```

### Verify

```bash
node -e "
const neo4j = require('neo4j-driver');
const { loadSecrets } = require('./api/src/functions/background/service-graph-aggregator/secrets.js');
(async () => {
  const s = await loadSecrets();
  const d = neo4j.driver(s.NEO4J_URI, neo4j.auth.basic(s.NEO4J_USER, s.NEO4J_PASSWORD));
  const session = d.session();
  const r = await session.run(\"MATCH (v:Verse) RETURN v.translation AS t, count(v) AS c\");
  r.records.forEach(rec => console.log(rec.get('t'), rec.get('c').toNumber()));
  await session.close(); await d.close();
})();
"
```

Expected: `KJV  31102` and `WEB  31102` (give or take — translations differ by a few verses).

---

## 3. Ingest a founder's book

The script accepts **PDF or EPUB**:

```bash
node api/src/scripts/ingest-book.js \
  --file ./books/loyalty-and-disloyalty.pdf \
  --title "Loyalty And Disloyalty" \
  --author "Dag Heward-Mills" \
  --publishedYear 1999

# EPUB works the same way:
node api/src/scripts/ingest-book.js \
  --file ./books/leading-the-leader.epub \
  --title "Leading The Leader" \
  --author "Dag Heward-Mills"

# Add a subtitle if relevant:
node api/src/scripts/ingest-book.js \
  --file ./books/transforming-leadership.pdf \
  --title "Transforming Leadership" \
  --subtitle "A Practical Guide for Pastors" \
  --author "Dag Heward-Mills"
```

The script:

1. Parses the file (PDF via `pdf-parse`, EPUB via `epub2`).
2. Detects chapters with a regex (`/^\s*(CHAPTER|Chapter)\s+(\d+|[IVX]+)/`). If none match, the whole file becomes "Full Text".
3. Splits chapters into ~500-token passages with ~50-token overlap.
4. Calls OpenAI `text-embedding-3-small` in batches of 96 — embedding the whole book usually costs **under $0.01**.
5. Writes `:Book`, `:BookChapter`, `:BookPassage` nodes with embeddings and `NEXT_PASSAGE` edges (for context expansion at query time).

### Re-running

Re-running with the same `--title` is **safe** — passage ids are deterministic (`<book-slug>-c<chapter>-p<passage>`), so existing nodes are overwritten via `MERGE … SET`. If you change your chunking strategy, expect orphan nodes from the old chunks — clean them up with:

```cypher
// Run interactively in Neo4j Browser
MATCH (b:Book {id: 'loyalty-and-disloyalty'})-[:HAS_CHAPTER]->(c)-[:HAS_PASSAGE]->(p)
RETURN count(p) AS currentPassages
```

### Verify

```cypher
MATCH (b:Book) RETURN b.title, b.author, size((b)-[:HAS_CHAPTER]->()) AS chapters
```

---

## 4. Preview a tip for ONE church (offline)

`preview-weekly-tip.js` is the developer-friendly path. It runs the **full RAG pipeline** for a single church and prints the prompt + Claude response. It does NOT write to Neo4j by default — pass `--write` if you want to persist.

```bash
# Real church mode — pulls trend data from Neo4j, generates, prints:
node api/src/scripts/preview-weekly-tip.js --church c1b2-bacenta-abc-123

# Same but also writes the tip (overwrites this week's WeeklyTip for that church):
node api/src/scripts/preview-weekly-tip.js --church c1b2-bacenta-abc-123 --write

# Synthetic mode — useful for iterating on prompts before any real data exists:
node api/src/scripts/preview-weekly-tip.js \
  --syntheticTrend "Service attendance: 8 weeks of data. Recent 4-week avg 35.0; prior 8-week avg 42.0 (-17%). Bussing: declined 3 weeks in a row."

# Override the synthetic church level:
node api/src/scripts/preview-weekly-tip.js \
  --syntheticTrend "..." \
  --level Stream \
  --churchName "Test Stream"
```

Output is printed in order:

1. **Trend brief** — the numeric summary the prompt receives. Eyeball this first.
2. **Retrieval** — which passages and verses came back, with cosine scores. If scores are below 0.30 the retrieval will refuse to call Claude.
3. **User prompt (truncated)** — the first 1.2k characters of what Claude sees.
4. **Claude raw response** — full text.
5. **Parsed JSON** — the structured tip.

If retrieval returns zero results, that means the knowledge base is empty — run steps 2 and 3 first.

### When to use which tool

| Tool | When |
| --- | --- |
| `preview-weekly-tip.js` | Iterating on a single church / prompt / synthetic input. Most-used during development. |
| `run-weekly-tip-generator.js` | Exercising the full Lambda batch path locally. Use `--dryRun` to validate retrieval without spending Claude tokens. |
| AWS EventBridge cron | Production. Once scheduled, this Lambda runs Sunday 23:00 GMT. |

---

## 5. Run the full Lambda batch

When you're ready to generate tips for every church with a leader:

```bash
# Dry run — retrieve and embed for every church, but skip Claude and Neo4j writes.
# Use this to confirm the church list, retrieval, and timing are sensible.
node api/src/scripts/run-weekly-tip-generator.js --dryRun

# Single church (real write):
node api/src/scripts/run-weekly-tip-generator.js --church c1b2-bacenta-abc-123

# Full batch (real write — produces one :WeeklyTip per church-with-leader):
node api/src/scripts/run-weekly-tip-generator.js
```

The script wraps the same `handler` function the AWS Lambda invokes. Once you're happy with the output, schedule it on EventBridge:

```
rate: every Sunday at 23:00 GMT
target: weekly-tip-generator Lambda
event: {}      # no payload = run for every church
```

---

## Reading the result in the app

Once tips exist for the current ISO week:

1. Log in as any leader.
2. Land on the dashboard.
3. The "Tip of the week" card appears after the metrics section — sourced from `weeklyTipForChurch(churchId: <selected-scope>)`.

If a leader leads multiple churches and switches scope via the picker, the card refetches and shows the tip for the new church. Co-leaders of the same church see the same tip.

If no tip exists for the current week, the card silently renders nothing — the dashboard layout reflows around it.

---

## Cost notes

| Item | Approx cost |
| --- | --- |
| Ingest a 70k-word book (embeddings only) | ~$0.005 |
| Ingest both KJV + WEB (embeddings only) | ~$0.04 |
| Tip generation (Claude Haiku, ~3k tokens) | ~$0.001 per tip |
| Weekly batch: 200 churches | ~$0.20 / week |

Costs scale linearly with church count. If they ever get unwieldy, the `inputHash` field on `:WeeklyTip` is already in place to skip churches whose trend brief hasn't changed since last week — wire that into the Lambda when you want it.

---

## Troubleshooting

**"OPENAI_API_KEY missing from AWS Secrets Manager bundle"**
The key isn't in the secret. Update via the AWS console (or `aws secretsmanager update-secret`) and re-run.

**"Retrieval returned 0 passages and 0 verses"**
The knowledge base is empty for this environment. Run `ingest-bible.js` and `ingest-book.js` first.

**"Tip generation: both models produced no parseable JSON"**
Claude returned prose without JSON. Inspect the raw response in the preview script's output. Usually a prompt issue — tweak `SYSTEM_PROMPT` in `weekly-tip-generator/index.js` (and the same constant in `preview-weekly-tip.js`).

**Tip is written but the dashboard doesn't show it**
- Check the ISO week computation. The resolver uses local-server time; if the Lambda wrote for week N but the resolver thinks it's week N+1, the lookup misses. Confirm timezone parity between Lambda and API.
- Check `$jwt.allowedChurchIds` includes the church id. Without it, the resolver returns FORBIDDEN.
- Run the query directly in Apollo Sandbox with a known-good JWT: `query { weeklyTipForChurch(churchId: "<id>") { id body } }`.

**Lint warnings on the ingestion scripts**
Most are `prettier/prettier` formatting nags. Run `npx prettier --write api/src/scripts/*.js` if they bother you; they don't block runtime.
