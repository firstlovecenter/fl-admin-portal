import sys, json
# Terminal shows ONLY Smith's thinking — 🧠 reasoning + 💬 commentary + the final result line.
# Tool calls (Bash/Read/Edit/Playwright) still stream into the full transcript (.agent/claude.log,
# archived per run) but are NOT printed here, keeping the live view a clean thought-stream. Never raises.
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    try: e = json.loads(line)
    except Exception: continue
    try:
        if e.get("type") == "assistant":
            for b in e.get("message",{}).get("content",[]):
                bt = b.get("type")
                if bt == "thinking":
                    tx = " ".join((b.get("thinking") or "").split())
                    if tx: print(f"    🧠 {tx[:220]}", flush=True)
                elif bt == "text":
                    tx = " ".join((b.get("text") or "").split())
                    if tx: print(f"    💬 {tx[:220]}", flush=True)
        elif e.get("type") == "result":
            dur = e.get("duration_ms")
            secs = f"{dur/1000:.0f}s" if isinstance(dur,(int,float)) else "?"
            print(f"    ── result: {'ERROR' if e.get('is_error') else 'ok'} · {e.get('num_turns','?')} turns · {secs}", flush=True)
    except Exception: continue
