import * as speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export interface TOTPSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
  manualEntryKey: string
}

export interface BackupCodeStatus {
  code: string
  used: boolean
  usedAt?: Date
}

class TOTPService {
  private static instance: TOTPService

  private constructor() {}

  static getInstance(): TOTPService {
    if (!TOTPService.instance) {
      TOTPService.instance = new TOTPService()
    }
    return TOTPService.instance
  }

  /**
   * Generate a new TOTP secret
   */
  generateSecret(): string {
    return speakeasy.generateSecret().base32
  }

  /**
   * Generate QR code for TOTP setup
   */
  async generateQRCode(secret: string, email: string, appName: string = 'AI Task Extraction'): Promise<string> {
    const issuer = appName
    const label = `${email}`
    const otpauthUrl = speakeasy.otpauthURL({ secret, label, issuer })
    
    try {
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = this.generateRandomCode(8).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  /**
   * Generate random alphanumeric code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Complete TOTP setup with secret, QR code, and backup codes
   */
  async setupTOTP(email: string): Promise<TOTPSetup> {
    const secret = this.generateSecret()
    const qrCode = await this.generateQRCode(secret, email)
    const backupCodes = this.generateBackupCodes()
    const manualEntryKey = secret

    return {
      secret,
      qrCode,
      backupCodes,
      manualEntryKey
    }
  }

  /**
   * Verify TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({ secret, token, window: 2 })
    } catch (error) {
      console.error('Error verifying TOTP token:', error)
      return false
    }
  }

  /**
   * Verify backup code format
   */
  isValidBackupCode(code: string): boolean {
    // Backup codes should be 8 characters, alphanumeric
    return /^[A-Z0-9]{8}$/.test(code)
  }

  /**
   * Format backup code for display (add spaces for readability)
   */
  formatBackupCode(code: string): string {
    if (code.length !== 8) return code
    return `${code.slice(0, 4)}-${code.slice(4)}`
  }

  /**
   * Parse backup code from formatted string
   */
  parseBackupCode(formattedCode: string): string {
    return formattedCode.replace(/-/g, '').toUpperCase()
  }

  /**
   * Generate current TOTP token for testing
   */
  getCurrentToken(secret: string): string {
    return speakeasy.totp({ secret })
  }

  /**
   * Get time remaining until next token
   */
  getTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000)
    const timeStep = 30
    return timeStep - (now % timeStep)
  }

  /**
   * Check if token is about to expire (less than 10 seconds)
   */
  isTokenExpiringSoon(): boolean {
    return this.getTimeRemaining() < 10
  }
}

export const totpService = TOTPService.getInstance()

// Database interfaces for 2FA
export interface UserTwoFactor {
  id: string
  userId: string
  secret: string
  enabled: boolean
  backupCodes: BackupCodeStatus[]
  createdAt: Date
  lastUsedAt?: Date
}

// Helper functions for database operations
export const createTwoFactorRecord = async (userId: string, secret: string, backupCodes: string[]): Promise<UserTwoFactor> => {
  // This would typically be a database operation
  // For now, return a mock record
  return {
    id: `2fa_${userId}`,
    userId,
    secret,
    enabled: false, // Not enabled until verified
    backupCodes: backupCodes.map(code => ({
      code,
      used: false
    })),
    createdAt: new Date()
  }
}

export const enableTwoFactor = async (userId: string): Promise<boolean> => {
  // Enable 2FA for user after successful verification
  // This would update the database
  console.log(`2FA enabled for user: ${userId}`)
  return true
}

export const disableTwoFactor = async (userId: string): Promise<boolean> => {
  // Disable 2FA for user
  // This would update the database
  console.log(`2FA disabled for user: ${userId}`)
  return true
}

export const getTwoFactorByUserId = async (userId: string): Promise<UserTwoFactor | null> => {
  // Get user's 2FA settings from database
  // For now, return null (not set up)
  return null
}

export const useBackupCode = async (userId: string, code: string): Promise<boolean> => {
  // Mark backup code as used
  // This would update the database
  console.log(`Backup code used for user: ${userId}, code: ${code}`)
  return true
}

export const regenerateBackupCodes = async (userId: string): Promise<string[]> => {
  // Generate new backup codes and invalidate old ones
  const newCodes = totpService.generateBackupCodes()
  console.log(`New backup codes generated for user: ${userId}`)
  return newCodes
}
