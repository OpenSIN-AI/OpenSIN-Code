# Terminal Notifications

Multi-provider notification system for OpenSIN-Code. Get notified when tasks complete, errors occur, or sessions go idle.

## Supported Providers

| Provider | Platform | Setup |
|----------|----------|-------|
| `macos` | macOS | Native — no setup needed |
| `linux` | Linux | Requires `notify-send` |
| `terminal-bell` | All | Native — no setup needed |
| `webhook` | All | Set webhook URL |
| `ntfy` | All | Set ntfy.sh topic URL |
| `slack` | All | Set Slack webhook URL |
| `telegram` | All | Set bot token + chat ID |

## Configuration

Create `~/.opensin/notifications.json`:

```json
{
  "enabled": true,
  "providers": [
    { "type": "terminal-bell", "enabled": true },
    { "type": "macos", "enabled": true, "sound": "Glass" },
    {
      "type": "slack",
      "enabled": true,
      "webhookUrl": "https://hooks.slack.com/services/...",
      "channel": "#dev-alerts"
    },
    {
      "type": "ntfy",
      "enabled": true,
      "url": "https://ntfy.sh/my-opensin-topic",
      "priority": 4
    },
    {
      "type": "telegram",
      "enabled": true,
      "botToken": "123456:ABC-DEF...",
      "chatId": "-1001234567890"
    }
  ],
  "quietHours": { "start": "22:00", "end": "07:00" },
  "cooldownMs": 5000
}
```

## API

```typescript
import { createNotificationManager } from '@opensin/sdk';

const nm = createNotificationManager();
await nm.init();

await nm.notify({
  title: 'Task Complete',
  body: 'All tests passed',
  level: 'success',
  event: 'task-complete',
});
```

## Notification Levels

| Level | Icon | Use Case |
|-------|------|----------|
| `info` | 🔵 | General information |
| `success` | 🟢 | Task completed successfully |
| `warning` | 🟡 | Potential issues |
| `error` | 🔴 | Errors and failures |
