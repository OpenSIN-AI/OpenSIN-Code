/**
 * Unit tests for feature flags
 */
import { describe, expect, it } from 'vitest';

import { isFeatureEnabled, enableFeature, disableFeature, getAllFlags, FEATURE_FLAGS } from '../../feature-flags/flags';

describe('FeatureFlags', () => {
  it('should have all expected flags', () => {
    expect(Object.keys(FEATURE_FLAGS).length).toBeGreaterThan(10);
  });

  it('should check if flag is enabled', () => {
    expect(isFeatureEnabled('COORDINATOR_MODE')).toBe(false);
  });

  it('should enable a feature', () => {
    enableFeature('COORDINATOR_MODE');
    expect(isFeatureEnabled('COORDINATOR_MODE')).toBe(true);
    disableFeature('COORDINATOR_MODE');
  });

  it('should disable a feature', () => {
    enableFeature('DAEMON');
    disableFeature('DAEMON');
    expect(isFeatureEnabled('DAEMON')).toBe(false);
  });

  it('should return all flags', () => {
    const all = getAllFlags();
    expect(all).toHaveProperty('KAIROS');
    expect(all).toHaveProperty('VOICE_MODE');
  });
});
