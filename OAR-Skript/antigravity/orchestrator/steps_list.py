# Single action: defines the ordered login workflow steps
STEPS = [
    ("steps/chrome/chrome01_open.py",      "Chrome geöffnet mit CDP Port"),
    ("steps/login/login01_navigate.py",    "Navigiert zu Google OAuth URL"),
    ("steps/login/login02_fill_email.py",  "Email-Feld ausgefüllt"),
    ("steps/login/login03_click_next.py",  "Weiter-Button geklickt"),
    ("steps/login/login04_fill_password.py","Passwort-Feld ausgefüllt"),
    ("steps/login/login05_click_signin.py","Anmelden-Button geklickt"),
    ("steps/login/login06_click_consent.py","Consent-Button geklickt"),
    ("steps/login/login07_capture_code.py","Auth-Code erfasst"),
    ("steps/token/token01_exchange.py",    "Token ausgetauscht"),
    ("steps/token/token02_userinfo.py",    "User-Info abgerufen"),
    ("steps/token/token03_save_account.py","Account gespeichert"),
    ("steps/token/token04_inject.py",      "Auth in opencode injiziert"),
    ("steps/chrome/chrome02_close.py",     "Chrome geschlossen"),
]
