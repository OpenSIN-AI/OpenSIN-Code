from core.token_consts import ANTIGRAVITY_CLIENT_ID, ANTIGRAVITY_REDIRECT_URI


def build_auth_url(state: str, code_challenge: str, email: str = "") -> str:
    scope = " ".join(
        [
            "https://www.googleapis.com/auth/cloud-platform",
            "openid",
            "email",
            "profile",
        ]
    )
    import urllib.parse

    params = "&".join(
        [
            f"client_id={ANTIGRAVITY_CLIENT_ID}",
            "response_type=code",
            f"redirect_uri={urllib.parse.quote(ANTIGRAVITY_REDIRECT_URI, safe='')}",
            f"scope={urllib.parse.quote(scope, safe='')}",
            f"state={state}",
            "access_type=offline",
            "prompt=consent",
            f"login_hint={urllib.parse.quote(email, safe='')}" if email else "",
            "hd=zukunftsorientierte-energie.de",
            "code_challenge_method=S256",
            f"code_challenge={code_challenge}",
        ]
    )
    params = "&".join(p for p in params.split("&") if p)
    return f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
