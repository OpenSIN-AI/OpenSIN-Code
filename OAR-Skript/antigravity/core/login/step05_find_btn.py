import json

CLICK_TEXTS = [
    "Anmelden",
    "Allow",
    "Zulassen",
    "Fortfahren",
    "Continue",
    "Weiter",
    "Accept",
    "Akzeptieren",
]


async def _find_button_coords(tab) -> dict | None:
    js = f'(()=>{{const texts={json.dumps(CLICK_TEXTS)};for(const btn of document.querySelectorAll(\'button,[role="button"],input[type="submit"],input[type="button"]\')){{const t=(btn.innerText||btn.textContent||btn.value||\'\').trim();if(texts.some(x=>t===x||t.includes(x))){{const r=btn.getBoundingClientRect();if(r.width>0&&r.height>0&&r.top>=0&&r.top<window.innerHeight)return JSON.stringify({{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),text:t}})}}}}return null}})()'
    result = await tab.evaluate(js)
    if not result:
        return None
    return json.loads(result) if isinstance(result, str) else result
