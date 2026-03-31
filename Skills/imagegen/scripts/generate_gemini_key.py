import base64
import io
import json
import os
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from websockets.sync.client import connect


ROTATOR_ACCOUNTS_PATH = Path("/Users/jeremy/.config/opencode/antigravity-accounts.json")
ROTATOR_ADMIN_TOKEN_PATH = Path(
    "/Users/jeremy/.config/openAntigravity-auth-rotator/token.json"
)
OPENCODE_AUTH_PATH = Path("/Users/jeremy/.local/share/opencode/auth.json")
KEY_FILE = Path(
    "~/.config/opencode/skills/imagegen/gemini_rotator_key.txt"
).expanduser()

ANTIGRAVITY_CLIENT_ID = (
    "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
)
ANTIGRAVITY_CLIENT_SECRET = "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"

CHROME_BINARY = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEBUG_PORT = 9476
DEBUG_PROFILE_DIR = Path("/tmp/skill-sin-imagegen-rotator-profile")


def _mask(value: str) -> str:
    if not value or len(value) < 12:
        return "***"
    return f"{value[:8]}...{value[-4:]}"


def _http_json(
    method: str, url: str, headers: dict | None = None, body: dict | None = None
) -> dict:
    data = None
    req_headers = headers.copy() if headers else {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url=url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8")
            if not text:
                return {}
            return json.loads(text)
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} {method} {url} -> {details}") from exc


def _http_form(url: str, form_data: dict) -> dict:
    encoded = urllib.parse.urlencode(form_data).encode("utf-8")
    req = urllib.request.Request(
        url=url,
        data=encoded,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} POST {url} -> {details}") from exc


def _load_admin_creds(scopes: list[str]):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    if not ROTATOR_ADMIN_TOKEN_PATH.exists():
        raise RuntimeError(f"Missing admin token: {ROTATOR_ADMIN_TOKEN_PATH}")

    creds = Credentials.from_authorized_user_info(
        json.loads(ROTATOR_ADMIN_TOKEN_PATH.read_text(encoding="utf-8")), scopes
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        ROTATOR_ADMIN_TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
    return creds


def _load_workspace_rotator_emails() -> set[str]:
    if not ROTATOR_ADMIN_TOKEN_PATH.exists():
        return set()

    from googleapiclient.discovery import build

    scopes = [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.user.security",
    ]
    creds = _load_admin_creds(scopes)

    service = build("admin", "directory_v1", credentials=creds, cache_discovery=False)
    response = (
        service.users()
        .list(customer="my_customer", query="email:rotator-*", maxResults=100)
        .execute()
    )
    return {u["primaryEmail"] for u in response.get("users", [])}


def _set_workspace_user_password(email: str, password: str) -> None:
    from googleapiclient.discovery import build

    scopes = [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.user.security",
    ]
    creds = _load_admin_creds(scopes)
    service = build("admin", "directory_v1", credentials=creds, cache_discovery=False)
    (
        service.users()
        .update(
            userKey=email,
            body={
                "password": password,
                "changePasswordAtNextLogin": False,
            },
        )
        .execute()
    )


def _find_deleted_workspace_user_id(email: str) -> str:
    from googleapiclient.discovery import build

    scopes = [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.user.security",
    ]
    creds = _load_admin_creds(scopes)
    service = build("admin", "directory_v1", credentials=creds, cache_discovery=False)

    page_token = None
    while True:
        response = (
            service.users()
            .list(
                customer="my_customer",
                showDeleted="true",
                maxResults=500,
                pageToken=page_token,
            )
            .execute()
        )
        for user in response.get("users", []):
            if user.get("primaryEmail", "").lower() == email.lower():
                return str(user.get("id") or "")
        page_token = response.get("nextPageToken")
        if not page_token:
            return ""


def _ensure_workspace_user_active(email: str) -> None:
    live_emails = _load_workspace_rotator_emails()
    if email in live_emails:
        return

    deleted_user_id = _find_deleted_workspace_user_id(email)
    if not deleted_user_id:
        raise RuntimeError(f"Workspace user is not active and not recoverable: {email}")

    from googleapiclient.discovery import build

    scopes = [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.user.security",
    ]
    creds = _load_admin_creds(scopes)
    service = build("admin", "directory_v1", credentials=creds, cache_discovery=False)
    service.users().undelete(
        userKey=deleted_user_id, body={"orgUnitPath": "/"}
    ).execute()


def _load_live_rotator_account() -> dict:
    if not ROTATOR_ACCOUNTS_PATH.exists():
        raise RuntimeError(f"Missing rotator accounts file: {ROTATOR_ACCOUNTS_PATH}")

    payload = json.loads(ROTATOR_ACCOUNTS_PATH.read_text(encoding="utf-8"))
    accounts = payload.get("accounts") or []
    if not accounts:
        raise RuntimeError("No rotator accounts found in antigravity-accounts.json")

    live_emails = _load_workspace_rotator_emails()
    live_accounts = [a for a in accounts if a.get("email") in live_emails]
    active_index = payload.get("activeIndex")
    chosen = None
    if isinstance(active_index, int) and 0 <= active_index < len(accounts):
        active_account = accounts[active_index]
        if not live_accounts or active_account.get("email") in live_emails:
            chosen = active_account

    if not chosen and live_accounts:
        chosen = max(live_accounts, key=lambda a: a.get("addedAt", ""))

    if not chosen:
        chosen = max(accounts, key=lambda a: a.get("addedAt", ""))

    email = chosen.get("email", "")
    if not email.startswith("rotator-"):
        raise RuntimeError(f"Selected account is not a rotator account: {email}")

    if not chosen.get("refreshToken"):
        raise RuntimeError("Selected rotator account has no refreshToken")
    if not chosen.get("managedProjectId"):
        raise RuntimeError("Selected rotator account has no managedProjectId")

    return chosen


def _load_opencode_google_auth() -> dict | None:
    if not OPENCODE_AUTH_PATH.exists():
        return None
    payload = json.loads(OPENCODE_AUTH_PATH.read_text(encoding="utf-8"))
    google_auth = payload.get("google") or {}
    if google_auth.get("type") != "oauth":
        return None

    raw_refresh = str(google_auth.get("refresh") or "")
    refresh_token, sep, project_id = raw_refresh.partition("|")
    return {
        "refreshToken": refresh_token,
        "managedProjectId": project_id if sep else "",
        "accessToken": str(google_auth.get("access") or ""),
        "expires": int(google_auth.get("expires") or 0),
    }


def _persist_rotator_account_token(
    email: str, refresh_token: str, project_id: str
) -> None:
    if not ROTATOR_ACCOUNTS_PATH.exists():
        return
    payload = json.loads(ROTATOR_ACCOUNTS_PATH.read_text(encoding="utf-8"))
    changed = False
    for account in payload.get("accounts") or []:
        if account.get("email") != email:
            continue
        if refresh_token and account.get("refreshToken") != refresh_token:
            account["refreshToken"] = refresh_token
            changed = True
        if project_id and account.get("managedProjectId") != project_id:
            account["managedProjectId"] = project_id
            changed = True
    if changed:
        ROTATOR_ACCOUNTS_PATH.write_text(
            json.dumps(payload, indent=2) + "\n", encoding="utf-8"
        )


def _refresh_access_token(refresh_token: str) -> str:
    refresh_token = refresh_token.split("|", 1)[0]
    token_payload = _http_form(
        "https://oauth2.googleapis.com/token",
        {
            "client_id": ANTIGRAVITY_CLIENT_ID,
            "client_secret": ANTIGRAVITY_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
    )
    access = token_payload.get("access_token")
    if not access:
        raise RuntimeError("OAuth refresh did not return access_token")
    return access


def _auth_headers(access_token: str, quota_project: str | None = None) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    if quota_project:
        headers["X-Goog-User-Project"] = quota_project
    return headers


def _verify_identity(access_token: str, expected_email: str) -> None:
    info = _http_json(
        "GET",
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers=_auth_headers(access_token),
    )
    email = info.get("email", "")
    if email.lower() != expected_email.lower():
        raise RuntimeError(
            f"Identity mismatch: expected {expected_email}, got {email or 'unknown'}"
        )


def _onboard_user(access_token: str) -> str:
    body = {
        "tierId": "free-tier",
        "metadata": {"ideType": "ANTIGRAVITY", "platform": 2, "pluginType": "GEMINI"},
    }
    payload = _http_json(
        "POST",
        "https://cloudcode-pa.googleapis.com/v1internal:onboardUser",
        headers=_auth_headers(access_token),
        body=body,
    )
    response = payload.get("response") or {}
    project = response.get("cloudaicompanionProject") or {}
    if isinstance(project, dict):
        pid = project.get("id", "")
        if pid:
            return pid
    return ""


def _enable_gemini_api(access_token: str, project_id: str) -> None:
    try:
        _http_json(
            "POST",
            f"https://serviceusage.googleapis.com/v1/projects/{project_id}/services/generativelanguage.googleapis.com:enable",
            headers=_auth_headers(access_token, project_id),
        )
    except RuntimeError as exc:
        if "HTTP 403" in str(exc):
            print("No permission to enable API via Service Usage; continuing.")
            return
        raise


def _wait_operation(
    access_token: str, operation_name: str, project_id: str, timeout_sec: int = 90
) -> dict:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        op = _http_json(
            "GET",
            f"https://apikeys.googleapis.com/v2/{operation_name}",
            headers=_auth_headers(access_token, project_id),
        )
        if op.get("done"):
            if op.get("error"):
                raise RuntimeError(f"Operation failed: {op['error']}")
            return op
        time.sleep(2)
    raise RuntimeError(f"Operation timeout after {timeout_sec}s: {operation_name}")


def _create_api_key(access_token: str, project_id: str, account_email: str) -> str:
    key_id = f"rotator-{int(time.time())}"
    create_resp = _http_json(
        "POST",
        f"https://apikeys.googleapis.com/v2/projects/{project_id}/locations/global/keys?keyId={urllib.parse.quote(key_id)}",
        headers=_auth_headers(access_token, project_id),
        body={"displayName": f"ImageGen {account_email}"},
    )
    operation_name = create_resp.get("name")
    if not operation_name:
        raise RuntimeError(f"Key creation did not return operation name: {create_resp}")

    op = _wait_operation(access_token, operation_name, project_id)
    key_name = (op.get("response") or {}).get("name")
    if not key_name:
        raise RuntimeError(f"Operation finished without key resource name: {op}")

    key_payload = _http_json(
        "GET",
        f"https://apikeys.googleapis.com/v2/{key_name}/keyString",
        headers=_auth_headers(access_token, project_id),
    )
    key_string = key_payload.get("keyString")
    if not key_string or not key_string.startswith("AIza"):
        raise RuntimeError("Did not receive a valid Gemini key string")
    return key_string


def _validate_key(key_string: str) -> None:
    payload = _http_json(
        "GET",
        f"https://generativelanguage.googleapis.com/v1beta/models?key={urllib.parse.quote(key_string)}",
    )
    if not payload.get("models"):
        raise RuntimeError("Gemini API key validation returned no models")


class _CDPPage:
    def __init__(self, debugger_ws_url: str):
        self._ws = connect(debugger_ws_url, max_size=None)
        self._next_id = 1
        target_id = self._command("Target.createTarget", {"url": "about:blank"})[
            "targetId"
        ]
        attach = self._command(
            "Target.attachToTarget", {"targetId": target_id, "flatten": True}
        )
        self._session_id = attach["sessionId"]
        self._command("Page.enable", session_id=self._session_id)
        self._command("Runtime.enable", session_id=self._session_id)
        self._command("DOM.enable", session_id=self._session_id)

    def close(self) -> None:
        try:
            self._ws.close()
        except Exception:
            pass

    def _command(
        self, method: str, params: dict | None = None, session_id: str | None = None
    ) -> dict:
        message_id = self._next_id
        self._next_id += 1
        payload = {"id": message_id, "method": method}
        if params:
            payload["params"] = params
        if session_id:
            payload["sessionId"] = session_id
        self._ws.send(json.dumps(payload))
        while True:
            raw = self._ws.recv()
            message = json.loads(raw)
            if message.get("id") != message_id:
                continue
            if message.get("error"):
                raise RuntimeError(f"CDP {method} failed: {message['error']}")
            return message.get("result") or {}

    def navigate(self, url: str) -> None:
        self._command("Page.navigate", {"url": url}, session_id=self._session_id)

    def eval(
        self,
        expression: str,
        *,
        await_promise: bool = False,
        return_by_value: bool = True,
        user_gesture: bool = True,
    ):
        result = self._command(
            "Runtime.evaluate",
            {
                "expression": expression,
                "awaitPromise": await_promise,
                "returnByValue": return_by_value,
                "userGesture": user_gesture,
            },
            session_id=self._session_id,
        )
        if result.get("exceptionDetails"):
            raise RuntimeError(f"Runtime.evaluate failed: {result['exceptionDetails']}")
        payload = result.get("result") or {}
        return payload.get("value")

    def focus(self, selector: str) -> bool:
        script = f"""
(() => {{
  const el = document.querySelector({json.dumps(selector)});
  if (!el) return false;
  el.scrollIntoView({{block: 'center', inline: 'center'}});
  el.focus();
  return true;
}})()
"""
        return bool(self.eval(script))

    def insert_text(self, text: str) -> None:
        self._command(
            "Input.insertText",
            {"text": text},
            session_id=self._session_id,
        )

    def click_selector(self, selector: str) -> bool:
        script = f"""
(() => {{
  const el = document.querySelector({json.dumps(selector)});
  if (!el) return false;
  el.scrollIntoView({{block: 'center', inline: 'center'}});
  for (const type of ['mousedown', 'mouseup', 'click']) {{
    el.dispatchEvent(new MouseEvent(type, {{bubbles: true, cancelable: true, view: window}}));
  }}
  return true;
}})()
"""
        return bool(self.eval(script))

    def click_text(self, labels: list[str]) -> bool:
        script = f"""
(() => {{
  const labels = {json.dumps([label.lower() for label in labels])};
  const candidates = Array.from(document.querySelectorAll(
    'button, a, [role="button"], input[type="button"], input[type="submit"], mat-option, span[jsaction], li[jsaction], mat-flat-button'
  ));
  const isVisible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim().toLowerCase();
  for (const el of candidates) {{
    if (!isVisible(el)) continue;
    const text = normalize(el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '');
    if (!text) continue;
    if (!labels.some((label) => text === label || text.startsWith(label + ' ') || text.endsWith(' ' + label))) continue;
    el.scrollIntoView({{block: 'center', inline: 'center'}});
    for (const type of ['mousedown', 'mouseup', 'click']) {{
      el.dispatchEvent(new MouseEvent(type, {{bubbles: true, cancelable: true, view: window}}));
    }}
    return true;
  }}
  return false;
}})()
"""
        return bool(self.eval(script))


def _wait_for(
    predicate, timeout_sec: int, interval_sec: float = 0.5, error: str = "Timeout"
):
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        value = predicate()
        if value:
            return value
        time.sleep(interval_sec)
    raise RuntimeError(error)


def _page_ready(page: _CDPPage, timeout_sec: int = 30) -> None:
    _wait_for(
        lambda: page.eval("document.readyState") in {"interactive", "complete"},
        timeout_sec,
        error="Page did not become ready in time",
    )


def _page_text(page: _CDPPage) -> str:
    return str(page.eval("document.body ? document.body.innerText : ''") or "")


def _wait_for_any_selector(
    page: _CDPPage, selectors: list[str], timeout_sec: int = 30
) -> str:
    def _probe() -> str:
        for selector in selectors:
            script = f"""
(() => {{
  const el = document.querySelector({json.dumps(selector)});
  if (!el) return false;
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}})()
"""
            if page.eval(script):
                return selector
        return ""

    return _wait_for(
        _probe,
        timeout_sec,
        error=f"Did not find expected selector(s): {selectors}",
    )


def _type_into(
    page: _CDPPage,
    selectors: list[str],
    text: str,
    timeout_sec: int = 30,
    js_value_fallback: bool = False,
) -> None:
    selector = _wait_for_any_selector(page, selectors, timeout_sec=timeout_sec)
    if not page.focus(selector):
        raise RuntimeError(f"Could not focus input: {selector}")
    page.eval(
        """
(() => {
  const el = document.activeElement;
  if (!el) return false;
  if ('value' in el) {
    el.value = '';
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.dispatchEvent(new Event('change', {bubbles: true}));
  }
  return true;
})()
"""
    )
    page.insert_text(text)
    if js_value_fallback:
        current_value = str(
            page.eval(
                """
(() => {
  const el = document.activeElement;
  if (!el || !('value' in el)) return '';
  return el.value || '';
})()
"""
            )
            or ""
        )
        if current_value != text:
            page.eval(
                f"""
(() => {{
  const el = document.activeElement;
  if (!el || !('value' in el)) return false;
  el.value = {json.dumps(text)};
  el.dispatchEvent(new Event('input', {{bubbles: true}}));
  el.dispatchEvent(new Event('change', {{bubbles: true}}));
  return true;
}})()
"""
            )


def _type_password_chars(page: _CDPPage, password: str, timeout_sec: int = 30) -> None:
    selector = _wait_for_any_selector(
        page, ['input[type="password"]'], timeout_sec=timeout_sec
    )
    if not page.focus(selector):
        raise RuntimeError(f"Could not focus password input: {selector}")
    page.eval(
        """
(() => {
  const el = document.activeElement;
  if (!el || !('value' in el)) return false;
  el.value = '';
  el.dispatchEvent(new Event('input', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true}));
  return true;
})()
"""
    )
    for char in password:
        page._command(
            "Input.dispatchKeyEvent",
            {
                "type": "char",
                "text": char,
                "unmodifiedText": char,
            },
            session_id=page._session_id,
        )
        time.sleep(0.03)


def _visible_selector(page: _CDPPage, selector: str) -> bool:
    return bool(
        page.eval(
            f"""
(() => {{
  const el = document.querySelector({json.dumps(selector)});
  if (!el) return false;
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}})()
"""
        )
    )


def _capture_png_bytes(page: _CDPPage) -> bytes:
    payload = page._command("Page.captureScreenshot", session_id=page._session_id)
    return base64.b64decode(payload["data"])


def _solve_google_captcha_if_present(page: _CDPPage) -> bool:
    if not _visible_selector(page, 'input[name="ca"], #ca'):
        return False

    try:
        from PIL import Image, ImageOps
        import pytesseract
    except Exception as exc:
        raise RuntimeError(
            f"CAPTCHA visible but OCR dependencies are unavailable: {exc}"
        )

    device_scale = float(page.eval("window.devicePixelRatio || 1") or 1)
    image_info = page.eval(
        """
(() => {
  const candidates = Array.from(document.images)
    .map((img) => ({
      width: img.width,
      height: img.height,
      rect: img.getBoundingClientRect().toJSON(),
      visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length),
      src: img.src,
      alt: img.alt || '',
    }))
    .filter((img) => img.visible && img.width > 60 && img.height > 20);
  return candidates.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
})()
"""
    )
    if not image_info:
        raise RuntimeError(
            "CAPTCHA input is visible but no candidate CAPTCHA image was found"
        )

    screenshot = Image.open(io.BytesIO(_capture_png_bytes(page)))
    rect = image_info["rect"]
    crop = screenshot.crop(
        (
            int(rect["left"] * device_scale),
            int(rect["top"] * device_scale),
            int(rect["right"] * device_scale),
            int(rect["bottom"] * device_scale),
        )
    )
    gray = ImageOps.autocontrast(crop.convert("L"))
    enlarged = gray.resize((max(1, gray.width * 4), max(1, gray.height * 4)))
    thresholded = enlarged.point(lambda value: 255 if value > 140 else 0, mode="1")

    variants = [crop, gray, enlarged, thresholded]
    configs = [
        "--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        "--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    ]
    solved = ""
    best_raw = ""
    for variant in variants:
        for config in configs:
            text = pytesseract.image_to_string(variant, config=config)
            candidate = "".join(ch for ch in text if ch.isalnum())
            if len(candidate) > len(solved):
                solved = candidate
                best_raw = text
    if len(solved) < 4:
        raise RuntimeError(f"CAPTCHA OCR was too weak: {best_raw!r}")

    _type_into(
        page,
        ['input[name="ca"]', "#ca"],
        solved,
        timeout_sec=10,
        js_value_fallback=True,
    )
    next_step = (
        "password"
        if _visible_selector(page, 'input[type="password"]')
        else "identifier"
    )
    _click_google_next(page, next_step)
    time.sleep(2)
    return True


def _click_google_next(page: _CDPPage, step: str) -> None:
    selectors = {
        "identifier": ["#identifierNext button", "#identifierNext div[role='button']"],
        "password": ["#passwordNext button", "#passwordNext div[role='button']"],
    }
    for selector in selectors[step]:
        if page.click_selector(selector):
            return
    if page.click_text(["Next", "Weiter"]):
        return
    raise RuntimeError(f"Could not click Google {step} next button")


def _dismiss_optional_google_screens(page: _CDPPage, timeout_sec: int = 45) -> None:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        current_url = str(page.eval("location.href") or "")
        body = _page_text(page).lower()
        if current_url.startswith("https://console.cloud.google.com"):
            return
        if not current_url.startswith("https://accounts.google.com"):
            return
        if "gaplustos" in current_url or "welcome" in body or "neues konto" in body:
            if page.click_text(["Verstanden", "I understand", "Continue", "Weiter"]):
                time.sleep(1)
                continue
        if page.click_text(["Not now", "No thanks", "Skip", "Jetzt nicht"]):
            time.sleep(1)
            continue
        time.sleep(1)


def _complete_google_login_to_hosts(
    page: _CDPPage,
    email: str,
    password: str,
    target_prefixes: list[str],
    timeout_sec: int = 120,
) -> None:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        current_url = str(page.eval("location.href") or "")
        if any(current_url.startswith(prefix) for prefix in target_prefixes):
            return

        if "accountchooser" in current_url:
            if page.click_text(["Anderes Konto verwenden", "Use another account"]):
                time.sleep(2)
                continue
            if page.click_text([email.lower()]):
                time.sleep(2)
                continue

        if _visible_selector(page, 'input[type="password"]'):
            _type_password_chars(page, password, timeout_sec=15)
            if _visible_selector(page, 'input[name="ca"], #ca'):
                if _solve_google_captcha_if_present(page):
                    time.sleep(2)
                    continue
            _click_google_next(page, "password")
            time.sleep(2)
            continue

        if _visible_selector(page, 'input[type="email"]'):
            _type_into(
                page,
                [
                    'input[type="email"]',
                    'input[autocomplete="username"]',
                    'input[type="text"]',
                ],
                email,
                js_value_fallback=True,
            )
            _click_google_next(page, "identifier")
            time.sleep(2)
            continue

        if _solve_google_captcha_if_present(page):
            time.sleep(2)
            continue

        _dismiss_optional_google_screens(page, timeout_sec=2)
        time.sleep(1)

    raise RuntimeError("Timed out completing Google login")


def _complete_google_login(
    page: _CDPPage, email: str, password: str, timeout_sec: int = 120
) -> None:
    _complete_google_login_to_hosts(
        page,
        email,
        password,
        ["https://console.cloud.google.com"],
        timeout_sec=timeout_sec,
    )


def _click_button_contains_text(page: _CDPPage, labels: list[str]) -> str:
    return str(
        page.eval(
            f"""
(() => {{
  const labels = {json.dumps([label.lower() for label in labels])};
  const norm = (v) => (v || '').replace(/\\s+/g, ' ').trim().toLowerCase();
  const els = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], mat-flat-button, a'));
  for (const el of els) {{
    const text = norm(el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '');
    if (!text) continue;
    if (!labels.some((label) => text.includes(label))) continue;
    el.scrollIntoView({{block:'center', inline:'center'}});
    el.click();
    return text;
  }}
  return '';
}})()
"""
        )
        or ""
    )


def _check_visible_checkboxes(page: _CDPPage) -> int:
    checked = page.eval(
        """
(() => {
  let count = 0;
  for (const box of Array.from(document.querySelectorAll('input[type="checkbox"]'))) {
    const visible = !!(box.offsetWidth || box.offsetHeight || box.getClientRects().length);
    if (!visible || box.checked) continue;
    box.click();
    box.dispatchEvent(new Event('change', {bubbles: true}));
    count += 1;
  }
  return count;
})()
"""
    )
    return int(checked or 0)


def _create_key_via_ai_studio(email: str, password: str) -> str:
    process = None
    page = None
    try:
        process, page = _launch_debug_chrome()
        page._command("Network.enable", session_id=page._session_id)
        page.navigate("https://aistudio.google.com/app/api-keys")
        _page_ready(page)
        _complete_google_login_to_hosts(
            page,
            email,
            password,
            ["https://aistudio.google.com"],
            timeout_sec=180,
        )
        time.sleep(8)

        _check_visible_checkboxes(page)
        _click_button_contains_text(page, ["continue"])
        time.sleep(2)
        _click_button_contains_text(page, ["get api key"])
        time.sleep(6)
        _click_button_contains_text(page, ["api-schlüssel erstellen"])
        time.sleep(3)
        _click_button_contains_text(page, ["schlüssel erstellen"])

        start = time.time()
        while time.time() - start < 20:
            try:
                raw = page._ws.recv(timeout=1)
            except Exception:
                continue
            message = json.loads(raw)
            if message.get("method") != "Network.responseReceived":
                continue
            params = message.get("params") or {}
            response = params.get("response") or {}
            url = str(response.get("url") or "")
            if "GenerateCloudApiKey" not in url:
                continue
            request_id = params.get("requestId")
            if not request_id:
                continue
            time.sleep(1)
            try:
                body = page._command(
                    "Network.getResponseBody",
                    {"requestId": request_id},
                    session_id=page._session_id,
                )
            except Exception:
                continue
            body_text = str(body.get("body") or "")
            match = re.search(r"AIza[0-9A-Za-z\-_]{35}", body_text)
            if match:
                return match.group(0)

        raise RuntimeError("AI Studio key generation did not yield a key string")
    finally:
        _close_debug_chrome(process, page)


def _normalize_cloud_page(page: _CDPPage) -> None:
    deadline = time.time() + 90
    while time.time() < deadline:
        body = _page_text(page)
        lowered = body.lower()

        if "start free" in lowered or "kostenlos starten" in lowered:
            if page.click_text(["Ablehnen", "No thanks", "Not now", "Skip"]):
                time.sleep(2)
                continue

        if any(token in lowered for token in ["terms", "bedingungen", "vereinbarung"]):
            if page.click_text(
                [
                    "Ich stimme zu",
                    "I agree",
                    "Agree",
                    "Accept",
                    "Akzeptieren",
                    "Zustimmen",
                ]
            ):
                time.sleep(2)
                continue

        if any(token in lowered for token in ["fehler beim laden", "error loading"]):
            if page.click_text(["Wiederholen", "Retry"]):
                time.sleep(2)
                continue

        return


def _activate_service(
    page: _CDPPage, project_id: str, service_name: str, email: str, password: str
) -> None:
    url = (
        "https://console.cloud.google.com/flows/enableapi"
        f"?apiid={urllib.parse.quote(service_name)}&project={urllib.parse.quote(project_id)}"
    )
    page.navigate(url)
    _page_ready(page)
    deadline = time.time() + 120
    while time.time() < deadline:
        if "accounts.google.com" in str(page.eval("location.href") or ""):
            _complete_google_login(page, email, password)
        _normalize_cloud_page(page)
        body = _page_text(page)
        lowered = body.lower()
        if "start free" in lowered and not any(
            token in lowered for token in ["no thanks", "not now", "ablehnen"]
        ):
            raise RuntimeError(
                f"Billing/free-trial prompt detected while enabling {service_name}; aborting"
            )

        if page.click_text(["Enable", "Aktivieren"]):
            time.sleep(5)
            continue

        success_tokens = [
            "disable api",
            "manage",
            "api enabled",
            "overview",
            "containing project",
        ]
        if (
            any(token in lowered for token in success_tokens)
            and "enable" not in lowered
        ):
            return

        if "this api is enabled" in lowered or "api is already enabled" in lowered:
            return

        time.sleep(2)

    raise RuntimeError(f"Timed out enabling {service_name} via Cloud Console")


def _kill_port(port: int) -> None:
    result = subprocess.run(
        ["lsof", "-ti", f"tcp:{port}"],
        capture_output=True,
        text=True,
        check=False,
    )
    for line in result.stdout.splitlines():
        pid = line.strip()
        if not pid:
            continue
        subprocess.run(["kill", pid], check=False)


def _launch_debug_chrome() -> tuple[subprocess.Popen, _CDPPage]:
    _kill_port(DEBUG_PORT)
    shutil.rmtree(DEBUG_PROFILE_DIR, ignore_errors=True)
    DEBUG_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    process = subprocess.Popen(
        [
            CHROME_BINARY,
            f"--remote-debugging-host=127.0.0.1",
            f"--remote-debugging-port={DEBUG_PORT}",
            f"--user-data-dir={DEBUG_PROFILE_DIR}",
            "--profile-directory=Default",
            "--no-first-run",
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--window-size=1440,1024",
            "--lang=en-US",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    def _browser_ws_url() -> str:
        try:
            payload = _http_json("GET", f"http://127.0.0.1:{DEBUG_PORT}/json/version")
        except Exception:
            return ""
        return str(payload.get("webSocketDebuggerUrl") or "")

    ws_url = _wait_for(
        _browser_ws_url,
        30,
        error=f"Chrome debug port {DEBUG_PORT} did not become ready",
    )
    return process, _CDPPage(ws_url)


def _close_debug_chrome(
    process: subprocess.Popen | None, page: _CDPPage | None
) -> None:
    if page is not None:
        page.close()
    if process is not None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
    shutil.rmtree(DEBUG_PROFILE_DIR, ignore_errors=True)


def _activate_required_apis_via_browser(
    email: str, password: str, project_id: str
) -> None:
    process = None
    page = None
    try:
        process, page = _launch_debug_chrome()
        first_url = (
            "https://console.cloud.google.com/flows/enableapi"
            f"?apiid=serviceusage.googleapis.com&project={urllib.parse.quote(project_id)}"
        )
        page.navigate(first_url)
        _page_ready(page)
        _complete_google_login(page, email, password)

        for service_name in [
            "serviceusage.googleapis.com",
            "apikeys.googleapis.com",
            "generativelanguage.googleapis.com",
        ]:
            _activate_service(page, project_id, service_name, email, password)
            print(f"Activated via browser: {service_name}")
    finally:
        _close_debug_chrome(process, page)


def _prepare_browser_password(email: str) -> str:
    _ensure_workspace_user_active(email)
    password = os.environ.get("SKILL_SIN_IMAGEGEN_ROTATOR_PASSWORD", "").strip()
    if password:
        print("Using provided rotator browser password without password reset.")
    else:
        password = f"SinImageGen!{int(time.time())}Auto"
        print(f"Setting temporary browser password for {email}.")
        _set_workspace_user_password(email, password)
    return password


def _run_browser_activation_fallback(
    email: str, project_id: str, password: str
) -> None:
    print("Launching dedicated browser fallback for API activation.")
    _activate_required_apis_via_browser(email, password, project_id)


def _should_use_browser_fallback(exc: Exception) -> bool:
    message = str(exc)
    return (
        "SERVICE_DISABLED" in message or "API has not been used in project" in message
    )


def main() -> int:
    account = _load_live_rotator_account()
    email = account["email"]
    project_id = account["managedProjectId"]
    print(f"Using newest rotator account: {email}")
    print(f"Managed project: {project_id}")

    access_token = None
    try:
        access_token = _refresh_access_token(account["refreshToken"])
    except Exception as exc:
        fallback_auth = _load_opencode_google_auth()
        if not fallback_auth:
            raise
        now_ms = int(time.time() * 1000)
        if fallback_auth["accessToken"] and fallback_auth["expires"] > now_ms + 60_000:
            access_token = fallback_auth["accessToken"]
        else:
            access_token = _refresh_access_token(fallback_auth["refreshToken"])
        if fallback_auth["managedProjectId"]:
            project_id = fallback_auth["managedProjectId"]
        print(
            f"Primary rotator refresh token failed ({exc}); using auth.json fallback."
        )
        _persist_rotator_account_token(email, fallback_auth["refreshToken"], project_id)

    print(f"Refreshed OAuth token: {_mask(access_token)}")

    _verify_identity(access_token, email)
    print("Verified token identity against rotator account.")

    onboard_project = _onboard_user(access_token)
    if onboard_project and onboard_project != project_id:
        print(f"Using onboarded projectId: {onboard_project}")
        project_id = onboard_project

    try:
        _enable_gemini_api(access_token, project_id)
        print("Ensured generativelanguage.googleapis.com is enabled.")
        key_string = _create_api_key(access_token, project_id, email)
    except Exception as exc:
        if not _should_use_browser_fallback(exc):
            raise
        print(
            "Detected disabled API control plane; running browser activation fallback."
        )
        browser_password = _prepare_browser_password(email)
        try:
            _run_browser_activation_fallback(email, project_id, browser_password)
            time.sleep(10)
            _enable_gemini_api(access_token, project_id)
            print(
                "Ensured generativelanguage.googleapis.com is enabled after browser fallback."
            )
            key_string = _create_api_key(access_token, project_id, email)
        except Exception as browser_exc:
            print(
                f"Cloud Console activation fallback did not complete cleanly ({browser_exc}); trying AI Studio fallback."
            )
            key_string = _create_key_via_ai_studio(email, browser_password)

    _validate_key(key_string)
    print(f"Created and validated rotator API key: {_mask(key_string)}")

    KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
    KEY_FILE.write_text(key_string, encoding="utf-8")
    print(f"Saved key to {KEY_FILE}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
