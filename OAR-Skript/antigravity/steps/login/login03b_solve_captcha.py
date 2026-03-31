# Atomic: detect Google image CAPTCHA, solve with pytesseract, submit
import nodriver as uc, asyncio, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import pytesseract
from PIL import Image
from shared.chrome_connect import connect; from shared.screenshot import save

async def main():
    browser = await connect(); tab = browser.tabs[0]
    found = None
    for _ in range(10):
        found = await tab.evaluate("(()=>{let i=document.querySelector('input');return i&&i.placeholder&&i.placeholder.includes('Text')?'found':null})()")
        if found == 'found': break
        await asyncio.sleep(0.2)
    if found != 'found': print("[login03b] No CAPTCHA — skipping."); return
    sc = await save(tab, "login03b_captcha_full")
    rect = json.loads(await tab.evaluate("JSON.stringify(document.querySelector('img').getBoundingClientRect())"))
    img = Image.open(sc).crop((int(rect['left']), int(rect['top']), int(rect['right']), int(rect['bottom'])))
    img.save("/tmp/captcha_crop.png")
    text = pytesseract.image_to_string(img, config="--psm 8 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyz0123456789").strip()
    print(f"[login03b] CAPTCHA solved: '{text}'")
    inp = await tab.find("input[placeholder*='Text'],input[type=tel]", timeout=5)
    await inp.clear_input(); await inp.send_keys(text)
    try: btn = await tab.find("Weiter", best_match=True, timeout=3); await btn.click()
    except Exception: await tab.keyboard.send("\n")
    await asyncio.sleep(0.3); await save(tab, "login03b_after_captcha")

if __name__ == '__main__': uc.loop().run_until_complete(main())
