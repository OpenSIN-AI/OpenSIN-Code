import asyncio, re, subprocess
async def _get_otp_from_imessage(timeout: int = 60) -> str | None:
    for _ in range(timeout // 5):
        for _ in range(25): await asyncio.sleep(0.2)
        try:
            result = subprocess.run(
                ["node", "-e",
                 "const {listMessages}=require('/Users/jeremy/dev/SIN-Solver/services/imessages/index.js');"
                 "listMessages({limit:5}).then(m=>console.log(JSON.stringify(m)))"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                m = re.search(r"\b([0-9]{6,8})\b", result.stdout.strip())
                if m: return m.group(1)
        except Exception: pass
    return None
