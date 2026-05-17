import os
import json

log_path = r"C:\Users\user\.gemini\antigravity\brain\917eb57a-49ad-4a6b-a7bb-f618bbdd6607\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Let's inspect line 249 which was the slide list reorganization
line = lines[249]
try:
    data = json.loads(line)
    print("Parsed JSON successfully!")
    tool_calls = data.get("tool_calls", [])
    for tc in tool_calls:
        print(f"Tool: {tc['name']}")
        args = tc.get("args", {})
        print(f"Args keys: {args.keys()}")
        if "ReplacementContent" in args:
            print(f"ReplacementContent length: {len(args['ReplacementContent'])}")
            print("ReplacementContent preview:")
            print(args['ReplacementContent'][:300])
        elif "ReplacementChunks" in args:
            chunks = json.loads(args["ReplacementChunks"])
            print(f"Chunks count: {len(chunks)}")
            for idx, c in enumerate(chunks):
                print(f"Chunk {idx} Start: {c['StartLine']}, End: {c['EndLine']}, Content length: {len(c['ReplacementContent'])}")
except Exception as e:
    print(f"Error: {e}")
