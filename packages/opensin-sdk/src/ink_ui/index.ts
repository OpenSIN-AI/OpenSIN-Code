// OpenSIN Ink Terminal UI
// React-inspired terminal rendering with component library and layout system

export type {
  Alignment,
  Direction,
  Overflow,
  FlexWrap,
  Dimensions,
  Position,
  Style,
  RenderContext,
  UIComponent,
  LayoutNode,
  FrameBuffer,
  TerminalState,
  RenderResult,
  ComponentProps,
  TextInputProps,
  ListProps,
  SpinnerProps,
  ProgressBarProps,
} from './types';

export { TerminalRenderer } from './renderer';
export { Text, Box, Spinner, ProgressBar, TextInput, List } from './components';
export { LayoutEngine } from './layout';
