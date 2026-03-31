# MCP Usage Guide (Best Practices)

## 1. Overview
Das WebAuto-Nodriver-MCP hat jetzt zwei klare Betriebsmodi:

- `stdio` fuer direkt angebundene lokale MCP-Clients
- `streamable-http` fuer einen persistenten Registry-Daemon unter `http://127.0.0.1:8765/mcp`

Wichtig: Der Chrome-CDP-Port `9335` ist **nicht** der MCP-Server-Port. Er zeigt nur an, ob Chrome fuer Browser-Automation erreichbar ist.

## 2. Standard Workflow (wie Serena, aber sauber getrennt)

### 2.1 MCP registrieren und Modus verstehen
```bash
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py activate webauto
```

Beispiel-Output:
```json
{
  "name": "WebAuto-Nodriver-MCP",
  "recommended_mode": "stdio for CLI clients, streamable-http for registry daemon",
  "stdio": {
    "command": [
      "python3",
      "/Users/jeremy/dev/webauto-nodriver-mcp/webauto_nodriver_mcp.py",
      "--transport",
      "stdio"
    ]
  },
  "daemon": {
    "command": [
      "python3",
      "/Users/jeremy/dev/webauto-nodriver-mcp/webauto_nodriver_mcp.py",
      "--transport",
      "streamable-http",
      "--host",
      "127.0.0.1",
      "--mcp-port",
      "8765"
    ],
    "mcp_url": "http://127.0.0.1:8765/mcp"
  },
  "post_connect_tools": ["list_tools", "mcp_status"]
}
```

### 2.2 Registry-Daemon starten
```bash
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py start webauto
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py status webauto
```

Erwartung:
- `daemon_status: running`
- `http_ready: true`
- `mcp_url: http://127.0.0.1:8765/mcp`

### 2.3 Direkten lokalen Client starten
```bash
python3 /Users/jeremy/dev/webauto-nodriver-mcp/webauto_nodriver_mcp.py --transport stdio
```

Nutze diesen Modus nur, wenn der Client den MCP-Prozess selbst verwaltet. `stdio` soll nicht als Hintergrund-Daemon gestartet werden.

### 2.4 Nach dem Verbinden immer zuerst
1. `list_tools()`
2. `mcp_status()`

Damit bekommt der Agent sofort die verfuegbaren Tools und den aktuellen Runtime-Status.

Aktueller Ist-Zustand: Die lokale MCP-Runtime exponiert derzeit **87** registrierte Tools. Verlasse dich auf Runtime-Discovery, nicht auf alte statische Toolzaehlungen.

## 3. Registry Commands

```bash
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py list
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py status webauto
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py activate webauto
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py start webauto
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py stop webauto
```

## 4. MCP-Tools Documentation

### Navigation & Browser
- `goto(url)`
- `click(x, y)`
- `type_text(text)`
- `press_key(key)`

### Screenshot & Recording
- `observe_screen()`
- `record_screen(seconds, fps, name)`
- `screenshot_to_file(path)`

### Status & Control
- `webauto_health()`
- `webauto_reset()`
- `check_google_login()`
- `configure_browser_target(...)`
- `launch_chrome_debug(...)`
- `debug_profile_bootstrap_status(...)`
- `bootstrap_authenticated_debug_profile(...)`
- `debug_profile_metadata_tool(...)`
- `debug_profile_google_ready()`
- `debug_profile_whatsapp_ready()`
- `debug_profile_login_checklist()`
- `open_debug_profile_auth_urls(...)`
- `relaunch_default_chrome_debug(...)`
- `extension_status()`
- `extension_page_state()`
- `extension_action_proposals()`
- `extension_clear_checkpoint_state()`
- `list_tools()`
- `mcp_status()`

### Communications & System
- `whatsapp_send(number, message)`
- `whatsapp_status()`
- `whatsapp_add_instance(id, number)`
- `mac_notes_create(folder, title, body)`
- `mac_notes_read(title)`
- `list_notes(...)`
- `mac_calendar_create(...)`
- `list_calendars()`
- `list_calendar_events(...)`
- `run_shortcut(name)`
- `iterm2_run(command)`
- `list_iterm2_sessions()`
- `iterm2_send_by_tty(tty, text)`
- `list_shortcuts()`
- `get_system_info(category)`
- `check_permissions()`
- `open_privacy_settings(pane)`
- `bootstrap_macos_developer_environment(...)`
- `configure_permission_for_app(...)`
- `describe_system_settings_rows(...)`
- `screenshot_system_settings(...)`
- `list_automator_quick_actions()`
- `create_automator_quick_action(...)`
- `create_iterm_quick_action(...)`
- `run_automator_quick_action(name)`
- `set_quick_action_shortcut(...)`
- `open_app(name)`
- `kill_app(name)`
- `list_apps()`
- `get_clipboard()`
- `set_clipboard(text)`
- `run_shell(cmd)`
- `sudo_cmd(cmd)`
- `execute_applescript(code)`
- `list_connected_iphones()`
- `make_phone_call(number)`
- `make_phone_call_confirmed(number)`
- `call_contact(name)`
- `call_contact_confirmed(name)`
- `send_sms(number, message)`
- `send_sms_confirmed(number, message)`
- `list_message_chats()`
- `messages_db_status()`
- `read_recent_messages(...)`
- `list_message_inbox(...)`
- `messages_unread_summary(...)`
- `extract_message_otp(...)`
- `extract_message_links(...)`
- `watch_message_otp(...)`
- `watch_message_links(...)`
- `facetime_call(target)`
- `facetime_call_confirmed(target)`
- `facetime_status()`
- `facetime_end_call()`
- `facetime_answer_call()`
- `watch_facetime_call_state()`
- `watch_incoming_call()`
- `get_iphone_info(device_id)`
- `iphone_screenshot(device_id)`
- `iphone_pair(device_id)`
- `run_ios_shortcut(name)`

## 5. Best Practices

- Immer `activate webauto` lesen, bevor du den MCP-Modus waehlst.
- Fuer persistente lokale Registry-Nutzung `streamable-http` verwenden.
- Fuer direkt angebundene lokale MCP-Clients `stdio` verwenden.
- `9335` nur als Chrome-CDP-Readiness sehen, nicht als MCP-Liveness.
- Nach Connect immer `list_tools()` und `mcp_status()` aufrufen.
- Bei Browser-Problemen zuerst `webauto_reset()` pruefen.
- Chrome 136+ blockiert Remote Debugging auf dem echten Default-Profil; dafuer `launch_chrome_debug()` mit einem dedizierten Profil nutzen.

## 6. Vergleich mit Serena

| Feature | Serena | WebAuto-Nodriver-MCP |
|---------|--------|----------------------|
| Aktivierung | Projekt-Aktivierung im MCP | `mcp-registry.py activate webauto` |
| Tool Discovery | Intern | `list_tools()` + `mcp_status()` |
| Lokaler Direktmodus | Intern verwaltet | `stdio` |
| Persistenter Daemon | Projektabhaengig | `streamable-http` auf `127.0.0.1:8765/mcp` |
| Browser Stealth | Standard | Erweitert mit echtem Chrome-Profil |

## 7. Troubleshooting

### Registry-Daemon startet nicht
```bash
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py status webauto
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py start webauto
python3 /Users/jeremy/dev/webauto-nodriver-mcp/mcp-registry.py stop webauto
```

### Browser reagiert nicht
1. `webauto_health()` pruefen
2. `mcp_status()` pruefen
3. `webauto_reset()` ausfuehren
4. Chrome-CDP-Readiness getrennt vom MCP-Status bewerten

---

**Status:** Dokumentation aktualisiert fuer `stdio` plus `streamable-http` Registry-Workflow.
