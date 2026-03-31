#!/usr/bin/env python3
"""
OpenAntigravity Auth Rotator - Google Admin User Creation Flow
Step 1: Öffne Chrome Profil "Geschäftlich" (Port 9336)
Step 2: Klicke auf "Neuen Benutzer hinzufügen"
Step 3: Fülle Formular aus (rotator-manual-01@zukunftsorientierte-energie.de)
Step 4: Speichere Cookies für dauerhafte Persistence
"""
import subprocess
import time
import sys

def step_1_open_chrome_profile():
    """Öffnet Chrome mit dem 'Geschäftlich' Profil (Port 9336)"""
    print("[Step 1] Öffne Chrome Profil 'Geschäftlich'...")
    # Chrome starten mit spezifischem Profil und Debug-Port
    subprocess.Popen([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--profile-directory=Geschäftlich",
        "--remote-debugging-port=9336",
        "https://admin.google.com/ac/users?journey=218"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(3)
    print("[Step 1] Chrome geöffnet.")

def step_2_click_new_user_button():
    """Klickt auf 'Neuen Benutzer hinzufügen' Button via AppleScript"""
    print("[Step 2] Klicke auf 'Neuen Benutzer hinzufügen'...")
    script = '''
    tell application "System Events"
        delay 2
        tell process "Google Chrome"
            -- Suche nach Button "Neuen Benutzer hinzufügen" oder "Add user"
            if exists (button 1 of window 1) then
                click button 1 of window 1
            else if exists (menu item "Neuen Benutzer hinzufügen" of menu bar 1) then
                click menu item "Neuen Benutzer hinzufügen" of menu bar 1
            end if
        end tell
    end tell
    '''
    try:
        subprocess.run(["osascript", "-e", script], check=True, capture_output=True)
        print("[Step 2] Klick ausgeführt.")
    except subprocess.CalledProcessError as e:
        print(f"[Step 2] Klick fehlgeschlagen: {e}")
        print("   Bitte manuell klicken auf 'Neuen Benutzer hinzufügen'")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "step2":
        step_2_click_new_user_button()
    else:
        step_1_open_chrome_profile()
        time.sleep(2)
        step_2_click_new_user_button()
