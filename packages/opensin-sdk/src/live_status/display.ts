import { LiveStatusSnapshot, StatusDisplayOptions } from "./types.js";

const STATUS_BAR_ID = "opensin-live-status-bar";
const STATUS_BAR_CSS_ID = "opensin-live-status-css";

const DEFAULT_OPTIONS: StatusDisplayOptions = {
  showTokens: true,
  showCost: true,
  showModel: true,
  showDuration: true,
};

export class StatusDisplay {
  #options: StatusDisplayOptions
  #visible: boolean
  #container: HTMLElement | null = null

  constructor(options: Partial<StatusDisplayOptions> = {}) {
    this.#options = { ...DEFAULT_OPTIONS, ...options }
    this.#visible = false
  }

  update(snapshot: LiveStatusSnapshot): void {
    if (!this.#visible) return
    this.#render(snapshot)
  }

  show(): void {
    this.#visible = true
    this.#ensureContainer()
  }

  hide(): void {
    this.#visible = false
    this.#removeContainer()
  }

  toggleOption<K extends keyof StatusDisplayOptions>(key: K): void {
    this.#options[key] = !this.#options[key] as StatusDisplayOptions[K]
  }

  setOptions(options: Partial<StatusDisplayOptions>): void {
    this.#options = { ...this.#options, ...options }
  }

  #ensureContainer(): void {
    if (this.#container && document.body.contains(this.#container)) return
    this.#container = document.createElement("div")
    this.#container.id = STATUS_BAR_ID
    this.#container.setAttribute("role", "status")
    this.#container.setAttribute("aria-live", "polite")
    this.#injectStyles()
    document.body.appendChild(this.#container)
  }

  #removeContainer(): void {
    this.#container?.remove()
    this.#container = null
    const css = document.getElementById(STATUS_BAR_CSS_ID)
    css?.remove()
  }

  #injectStyles(): void {
    if (document.getElementById(STATUS_BAR_CSS_ID)) return
    const style = document.createElement("style")
    style.id = STATUS_BAR_CSS_ID
    style.textContent = `
      #${STATUS_BAR_ID} {
        position: fixed;
        bottom: 8px;
        right: 12px;
        background: rgba(30, 30, 30, 0.92);
        color: #e5e5e5;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 11px;
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        z-index: 99999;
        pointer-events: none;
        backdrop-filter: blur(6px);
        display: flex;
        gap: 12px;
        align-items: center;
        max-width: 520px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${STATUS_BAR_ID} .status-segment {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      #${STATUS_BAR_ID} .status-label {
        color: #888;
      }
      #${STATUS_BAR_ID} .status-value {
        color: #e5e5e5;
        font-weight: 500;
      }
      #${STATUS_BAR_ID} .status-streaming-indicator {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10B981;
        animation: opensin-pulse 1.2s ease-in-out infinite;
      }
      @keyframes opensin-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `
    document.head.appendChild(style)
  }

  #render(snapshot: LiveStatusSnapshot): void {
    if (!this.#container) return

    const segments: string[] = []

    if (snapshot.isStreaming) {
      segments.push(
        '<span class="status-segment">' +
        '<span class="status-streaming-indicator"></span>' +
        '<span class="status-value">Streaming</span>' +
        "</span>",
      )
    }

    if (this.#options.showModel) {
      segments.push(
        `<span class="status-segment">` +
        `<span class="status-label">model</span>` +
        `<span class="status-value">${this.#truncate(snapshot.modelId, 24)}</span>` +
        `</span>`,
      )
    }

    if (this.#options.showTokens) {
      segments.push(
        `<span class="status-segment">` +
        `<span class="status-label">tokens</span>` +
        `<span class="status-value">${snapshot.totalTokens.toLocaleString()}</span>` +
        `</span>`,
      )
    }

    if (this.#options.showCost) {
      segments.push(
        `<span class="status-segment">` +
        `<span class="status-label">cost</span>` +
        `<span class="status-value">$${snapshot.costUsd.toFixed(4)}</span>` +
        `</span>`,
      )
    }

    if (this.#options.showDuration) {
      const secs = (snapshot.turnDurationMs / 1000).toFixed(1)
      segments.push(
        `<span class="status-segment">` +
        `<span class="status-label">time</span>` +
        `<span class="status-value">${secs}s</span>` +
        `</span>`,
      )
    }

    this.#container.innerHTML = segments.join(
      '<span class="status-segment" style="color:#444">|</span>',
    )
  }

  #truncate(str: string, max: number): string {
    return str.length > max ? str.slice(0, max - 1) + "…" : str
  }
}
