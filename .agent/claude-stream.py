import sys, json
def hint(inp):
    if not isinstance(inp, dict): return ""
    for k in ("command","file_path","pattern","url","description","prompt"):
        v = inp.get(k)
        if v: return " ".join(str(v).split())[:90]
    return ""
def short(n): return (n or "tool").replace("mcp__playwright__","pw:").replace("mcp__","")
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    try: e = json.loads(line)
    except Exception: continue
    try:
        t = e.get("type")
        if t == "assistant":
            for b in e.get("message",{}).get("content",[]):
                bt = b.get("type")
                if bt == "tool_use":
                    print(f"    · {short(b.get('name'))} {hint(b.get('input',{}))}".rstrip(), flush=True)
                elif bt == "text":
                    tx = " ".join(b.get("text","").split())
                    if tx: print(f"    💬 {tx[:150]}", flush=True)
        elif t == "result":
            dur = e.get("duration_ms")
            secs = f"{dur/1000:.0f}s" if isinstance(dur,(int,float)) else "?"
            print(f"    ── result: {'ERROR' if e.get('is_error') else 'ok'} · {e.get('num_turns','?')} turns · {secs}", flush=True)
    except Exception: continue
