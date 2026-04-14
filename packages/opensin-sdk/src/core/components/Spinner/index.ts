export { FlashingChar } from './FlashingChar'
export { GlimmerMessage } from './GlimmerMessage'
export { ShimmerChar } from './ShimmerChar'
export { SpinnerGlyph } from './SpinnerGlyph'
export type { SpinnerMode } from './types'
export { useShimmerAnimation } from './useShimmerAnimation'
export { useStalledAnimation } from './useStalledAnimation'
export { getDefaultCharacters, interpolateColor } from './utils'
// Teammate components are NOT exported here - use dynamic require() to enable dead code elimination
// See REPL.tsx and Spinner.tsx for the correct import pattern
