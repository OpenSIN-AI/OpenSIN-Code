import { createFallbackStorage } from './fallbackStorage'
import { macOsKeychainStorage } from './macOsKeychainStorage'
import { plainTextStorage } from './plainTextStorage'
import type { SecureStorage } from './types'

/**
 * Get the appropriate secure storage implementation for the current platform
 */
export function getSecureStorage(): SecureStorage {
  if (process.platform === 'darwin') {
    return createFallbackStorage(macOsKeychainStorage, plainTextStorage)
  }

  // TODO: add libsecret support for Linux

  return plainTextStorage
}
