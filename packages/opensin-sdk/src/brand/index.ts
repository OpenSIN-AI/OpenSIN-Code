/**
 * OpenSIN Brand System
 *
 * Complete brand enforcement layer for all generated media.
 * Every image, video, blog post, and social content MUST pass
 * through this system to ensure brand consistency.
 */

export { OPENSIN_BRAND } from './guidelines.js'
export type { OpenSINBrand } from './guidelines.js'
export { BrandEnforcer } from './enforcer.js'
export { MediaPackager } from './packager.js'
export { ContentPipeline } from './pipeline.js'
