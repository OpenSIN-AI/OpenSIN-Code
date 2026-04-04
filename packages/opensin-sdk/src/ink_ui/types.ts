/**
 * OpenSIN Ink Terminal UI — Type Definitions
 *
 * Types for terminal UI rendering, component library,
 * and responsive terminal layout system.
 */

export type Alignment = 'left' | 'center' | 'right';
export type Direction = 'horizontal' | 'vertical';
export type Overflow = 'visible' | 'hidden' | 'scroll';
export type FlexWrap = 'nowrap' | 'wrap';

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Style {
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
  align?: Alignment;
  display?: 'flex' | 'block' | 'none';
  flexDirection?: Direction;
  flexWrap?: FlexWrap;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  padding?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  margin?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  overflowX?: Overflow;
  overflowY?: Overflow;
  borderStyle?: 'single' | 'double' | 'rounded' | 'bold' | 'none';
  borderColor?: string;
  wrap?: boolean;
}

export interface RenderContext {
  stdout: NodeJS.WriteStream;
  stdin: NodeJS.ReadStream;
  stderr: NodeJS.WriteStream;
  dimensions: Dimensions;
  frame: number;
  isTTY: boolean;
}

export interface UIComponent {
  render(ctx: RenderContext): string;
  measure(ctx: RenderContext): Dimensions;
  children?: UIComponent[];
  style?: Style;
  key?: string;
}

export interface LayoutNode {
  component: UIComponent;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
}

export interface FrameBuffer {
  cells: string[][];
  styles: Style[][];
  width: number;
  height: number;
  cursor: Position;
}

export interface TerminalState {
  dimensions: Dimensions;
  cursorVisible: boolean;
  altScreen: boolean;
  mouseTracking: boolean;
  title?: string;
}

export interface RenderResult {
  output: string;
  patches: string[];
  cursorPosition: Position;
  dimensions: Dimensions;
}

export interface ComponentProps {
  style?: Style;
  children?: unknown;
  key?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
}

export interface TextInputProps extends ComponentProps {
  value: string;
  placeholder?: string;
  mask?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export interface ListProps<T> extends ComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => UIComponent;
  selectedIndex?: number;
  onSelect?: (item: T, index: number) => void;
  keyExtractor?: (item: T, index: number) => string;
}

export interface SpinnerProps extends ComponentProps {
  type?: 'dots' | 'line' | 'simpleDots' | 'simpleLine' | 'arrow';
  color?: string;
  speed?: number;
}

export interface ProgressBarProps extends ComponentProps {
  value: number;
  max: number;
  width?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  format?: (value: number, max: number) => string;
}
