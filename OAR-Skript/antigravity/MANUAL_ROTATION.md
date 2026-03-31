# Manuelle Rotation mit echtem OAuth-Refresh-Token

## Schritt 1: Chrome auf Port 7654 mit frischem Temp-Profil starten
```bash
pkill -9 "Google Chrome"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=7654 \
  --user-data-dir="/tmp/openAntigravity_login_profile_7654" \
  --disable-sync \
  --hide-crash-restore-bubble \
  --disable-features=SigninInterceptBubble,ExplicitBrowserSigninUIOnDesktop \
  about:blank
```

## Schritt 2: Manuell den echten Google-OAuth-Flow durchgehen
1. OAuth-URL aufrufen
2. Im Identifier-Step nur `rotator-XXXX` eingeben, nicht blind den ganzen String erzwingen
3. Passwort eingeben
4. Auf `Willkommen in Ihrem neuen Konto` exakt in dieser Reihenfolge arbeiten: DOM-Klick auf `Verstanden` -> CDP-Klick -> `Tab` x11 -> `Enter`
5. Sobald `gaplustos` verlassen ist, keine generischen Hintergrund-Klicks mehr ausfuehren
6. Falls `In Chrome anmelden?` erscheint: `Chrome ohne Konto verwenden`
7. Danach die Debug-Chrome-Session auf Port 7654 schliessen

## Schritt 3: Account injizieren
```bash
cd ~/dev/openAntigravity-auth-rotator
python3 steps/token/token04_inject.py --email rotator-XXXX@zukunftsorientierte-energie.de
```

## Schritt 4: Status prüfen
```bash
python3 main.py status
```

## Wichtig

- Google-App-Passwörter helfen hier nicht
- Für `google/antigravity-*` wird ein echter OAuth-Refresh-Token gebraucht
- Service-Account-Impersonation reicht nur für Admin-SDK-/Gemini-API-Zwecke
