/**
 * OpenSIN Brand System
 *
 * Complete brand enforcement layer for all generated media.
 * Every image, video, blog post, and social content MUST pass
 * through this system to ensure brand consistency.
 */

export { OPENSIN_BRAND } from './guidelines'
export type { OpenSINBrand } from './guidelines'
export { BrandEnforcer } from './enforcer'
export { MediaPackager } from './packager'
export { ContentPipeline } from './pipeline'
