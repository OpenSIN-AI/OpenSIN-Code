import { createElement, type ReactNode } from 'react'
import { ThemeProvider } from './components/design-system/ThemeProvider'
import inkRender, {
  type Instance,
  createRoot as inkCreateRoot,
  type RenderOptions,
  type Root,
} from './ink/root'

export type { RenderOptions, Instance, Root }

// Wrap all CC render calls with ThemeProvider so ThemedBox/ThemedText work
// without every call site having to mount it. Ink itself is theme-agnostic.
function withTheme(node: ReactNode): ReactNode {
  return createElement(ThemeProvider, null, node)
}

export async function render(
  node: ReactNode,
  options?: NodeJS.WriteStream | RenderOptions,
): Promise<Instance> {
  return inkRender(withTheme(node), options)
}

export async function createRoot(options?: RenderOptions): Promise<Root> {
  const root = await inkCreateRoot(options)
  return {
    ...root,
    render: node => root.render(withTheme(node)),
  }
}

export { color } from './components/design-system/color'
export type { Props as BoxProps } from './components/design-system/ThemedBox'
export { default as Box } from './components/design-system/ThemedBox'
export type { Props as TextProps } from './components/design-system/ThemedText'
export { default as Text } from './components/design-system/ThemedText'
export {
  ThemeProvider,
  usePreviewTheme,
  useTheme,
  useThemeSetting,
} from './components/design-system/ThemeProvider'
export { Ansi } from './ink/Ansi'
export type { Props as AppProps } from './ink/components/AppContext'
export type { Props as BaseBoxProps } from './ink/components/Box'
export { default as BaseBox } from './ink/components/Box'
export type {
  ButtonState,
  Props as ButtonProps,
} from './ink/components/Button'
export { default as Button } from './ink/components/Button'
export type { Props as LinkProps } from './ink/components/Link'
export { default as Link } from './ink/components/Link'
export type { Props as NewlineProps } from './ink/components/Newline'
export { default as Newline } from './ink/components/Newline'
export { NoSelect } from './ink/components/NoSelect'
export { RawAnsi } from './ink/components/RawAnsi'
export { default as Spacer } from './ink/components/Spacer'
export type { Props as StdinProps } from './ink/components/StdinContext'
export type { Props as BaseTextProps } from './ink/components/Text'
export { default as BaseText } from './ink/components/Text'
export type { DOMElement } from './ink/dom'
export { ClickEvent } from './ink/events/click-event'
export { EventEmitter } from './ink/events/emitter'
export { Event } from './ink/events/event'
export type { Key } from './ink/events/input-event'
export { InputEvent } from './ink/events/input-event'
export type { TerminalFocusEventType } from './ink/events/terminal-focus-event'
export { TerminalFocusEvent } from './ink/events/terminal-focus-event'
export { FocusManager } from './ink/focus'
export type { FlickerReason } from './ink/frame'
export { useAnimationFrame } from './ink/hooks/use-animation-frame'
export { default as useApp } from './ink/hooks/use-app'
export { default as useInput } from './ink/hooks/use-input'
export { useAnimationTimer, useInterval } from './ink/hooks/use-interval'
export { useSelection } from './ink/hooks/use-selection'
export { default as useStdin } from './ink/hooks/use-stdin'
export { useTabStatus } from './ink/hooks/use-tab-status'
export { useTerminalFocus } from './ink/hooks/use-terminal-focus'
export { useTerminalTitle } from './ink/hooks/use-terminal-title'
export { useTerminalViewport } from './ink/hooks/use-terminal-viewport'
export { default as measureElement } from './ink/measure-element'
export { supportsTabStatus } from './ink/termio/osc'
export { default as wrapText } from './ink/wrap-text'
