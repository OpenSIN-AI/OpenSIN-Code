# OpenSIN Runbooks

## 1. OpenCode Desktop won't start

**Symptoms:** Desktop app doesn't open, or crashes immediately.

**Steps:**
```bash
# 1. Kill stuck processes
pkill -f "OpenCode" 2>/dev/null

# 2. Check window state (fullscreen lock)
cat ~/Library/Application\ Support/ai.opencode.desktop/.window-state.json
# Fix: set "fullscreen": false

# 3. Clear error notifications in global state
cat ~/Library/Application\ Support/ai.opencode.desktop/opencode.global.dat | \
  python3 -c "import json,sys; d=json.load(sys.stdin); d['notification']=json.dumps({'list':[]}); print(json.dumps(d))" > /tmp/g.dat && mv /tmp/g.dat ~/Library/Application\ Support/ai.opencode.desktop/opencode.global.dat

# 4. Remove stale DB locks
rm -f ~/.config/opencode/opencode.db-shm ~/.config/opencode/opencode.db-wal

# 5. Disable broken TS plugins
mkdir -p ~/opencode-plugins-backup
mv ~/.config/opencode/plugins/*.ts ~/opencode-plugins-backup/ 2>/dev/null

# 6. Launch
open -a "OpenCode"
```

## 2. OpenCode CLI hangs

**Symptoms:** `opencode --version` never returns.

**Root Cause:** pnpm wrapper uses `bunx opencode` which hangs.

**Fix:**
```bash
cat > ~/Library/pnpm/opencode << 'EOF'
#!/bin/bash
set -euo pipefail
exec ~/.opencode/bin/opencode "$@"
EOF
chmod +x ~/Library/pnpm/opencode
```

## 3. "User not found" from OpenRouter

**Symptoms:** OpenCode shows "User not found" error.

**Steps:**
```bash
# 1. Test current API key
curl -s "https://openrouter.ai/api/v1/auth/key" \
  -H "Authorization: Bearer $(cat ~/.openrouter/api_key.json | python3 -c 'import json,sys; print(json.load(sys.stdin)["apiKey"])')" \
  | python3 -m json.tool

# 2. If 401 — key is invalid. Get new key from openrouter.ai/keys
# 3. Update key in all locations:
NEW_KEY="sk-or-v1-YOUR_NEW_KEY"
sed -i '' "s/sk-or-v1-.*/$NEW_KEY/" ~/.config/opencode/opencode.json
echo "{\"apiKey\":\"$NEW_KEY\"}" > ~/.openrouter/api_key.json
echo "$NEW_KEY" >> ~/.open-auth-rotator/openrouter/keys.txt

# 4. Restart Swapper
pkill -f openrouter_swapper
cd ~/.open-auth-rotator/openrouter && nohup python3 openrouter_swapper.py > swapper-service.log 2>&1 &
echo $! > .swapper.pid

# 5. Verify
curl -s http://127.0.0.1:9338/health
```

## 4. Swapper Proxy not responding

**Symptoms:** `curl http://127.0.0.1:9338/health` fails.

**Steps:**
```bash
# 1. Check if running
ps aux | grep openrouter_swapper | grep -v grep

# 2. Check logs
tail -20 ~/.open-auth-rotator/openrouter/swapper-service.log

# 3. Restart
pkill -f openrouter_swapper
cd ~/.open-auth-rotator/openrouter && nohup python3 openrouter_swapper.py > swapper-service.log 2>&1 &
echo $! > .swapper.pid
sleep 3

# 4. Verify
curl -s http://127.0.0.1:9338/health | python3 -m json.tool
```

## 5. TypeScript errors in opensin-sdk

**Steps:**
```bash
cd /Users/jeremy/dev/OpenSIN-Code-new/packages/opensin-sdk
bunx tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules"
# Should return 0 errors
```

## 6. Key Pool Management

**Check pool:**
```bash
cat ~/.open-auth-rotator/openrouter/keys.txt | wc -l  # count
cat ~/.open-auth-rotator/openrouter/pool.json | python3 -m json.tool  # details
```

**Add new key:**
```bash
echo "sk-or-v1-NEW_KEY" >> ~/.open-auth-rotator/openrouter/keys.txt
python3 -c "
import json
with open('$HOME/.open-auth-rotator/openrouter/pool.json') as f:
    pool = json.load(f)
pool['keys'].append({'key': 'sk-or-v1-NEW_KEY', 'label': 'key-N', 'added': '2026-04-04', 'active': True})
with open('$HOME/.open-auth-rotator/openrouter/pool.json', 'w') as f:
    json.dump(pool, f, indent=2)
"
```

## 7. OpenSIN CLI — Build & Test

**Symptoms:** Need to verify the CLI builds and tests pass.

**Steps:**
```bash
cd packages/opensin-sdk
bun install
bun run build # Should show 0 TypeScript errors
bun run test # Should show all tests passing
```

## 8. OpenSIN CLI — Agent Loop Debugging

**Symptoms:** Agent loop not processing tool calls or hanging.

**Steps:**
```bash
# Check agent loop types
cat packages/opensin-sdk/src/agent_loop/types.ts

# Check NDJSON output
node dist/standalone_cli/index.js "test query" 2>&1 | head -20

# Check tool registry
cat packages/opensin-sdk/src/agent_loop/tool_registry.ts

# Check context management
cat packages/opensin-sdk/src/agent_loop/context.ts
```

## 9. stdin_handler REPL Issues

**Symptoms:** CLI REPL crashes on input or slash commands don't work.

**Fix:** The stdin_handler.ts was rewritten to fix duplicate code blocks. If issues persist:
```bash
# Verify clean file
wc -l packages/opensin-sdk/src/standalone_cli/stdin_handler.ts  # Should be ~189 lines

# Rebuild
cd packages/opensin-sdk && bun run build
```
