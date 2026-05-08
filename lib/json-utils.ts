/**
 * Utility functions for safe JSON parsing and validation
 */

/**
 * Safely parse JSON with fallback to default value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue
  }

  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('JSON parsing failed, using default value:', error)
    console.warn('Malformed JSON string:', jsonString)
    return defaultValue
  }
}

/**
 * Validate if a string is valid JSON
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

/**
 * Safely stringify an object to JSON
 */
export function safeJsonStringify(obj: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(obj)
  } catch (error) {
    console.warn('JSON stringification failed, using default value:', error)
    return defaultValue
  }
}

/**
 * Clean and fix common JSON issues
 */
export function cleanJsonString(jsonString: string): string {
  if (!jsonString || typeof jsonString !== 'string') {
    return '{}'
  }

  // Ultimate safety check: if string contains unterminated string patterns, skip parsing entirely
  if (jsonString.includes('"') && !isStringTerminated(jsonString)) {
    console.warn('Detected unterminated string, skipping JSON parsing entirely')
    return '{"allowGuestAccess":false,"requireApprovalForJoin":true,"enableFileUploads":true,"maxFileSize":10}'
  }

  try {
    let cleaned = jsonString.trim()
    
    // Remove BOM and other invisible characters
    cleaned = cleaned.replace(/^\uFEFF/, '')
    
    // Fix common syntax issues
    cleaned = cleaned
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Remove trailing commas before closing brackets/braces (more aggressive)
      .replace(/,(\s*)\}/g, '}')
      .replace(/,(\s*)\]/g, ']')
      // Fix missing quotes around property names
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
      // Fix single quotes to double quotes
      .replace(/'/g, '"')
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      // Fix unescaped newlines in strings
      .replace(/:\s*"([^"]*)\n([^"]*?)"/g, (match, p1, p2) => {
        return `: "${p1.replace(/\n/g, '\\n')}${p2.replace(/\n/g, '\\n')}"`
      })
      // Fix unescaped quotes in strings
      .replace(/:\s*"([^"]*)"([^"]*?)"/g, (match, p1, p2) => {
        if (p2.includes('"')) {
          return `: "${p1.replace(/"/g, '\\"')}${p2.replace(/"/g, '\\"')}"`
        }
        return match
      })
      // Fix escaped quotes that are double-escaped
      .replace(/\\\\+"/g, '\\"')
    
    // Try to validate the cleaned JSON safely
    try {
      const testParse = JSON.parse(cleaned)
      // If we get here, JSON is valid
      return cleaned
    } catch (validateError) {
      console.warn('Cleaned JSON still invalid, returning safe defaults')
      return '{"allowGuestAccess":false,"requireApprovalForJoin":true,"enableFileUploads":true,"maxFileSize":10}'
    }
  } catch (error) {
    console.error('Error in cleanJsonString:', error)
    return '{"allowGuestAccess":false,"requireApprovalForJoin":true,"enableFileUploads":true,"maxFileSize":10}'
  }
}

// Helper function to check if strings are properly terminated
function isStringTerminated(str: string): boolean {
  let inString = false
  let escapeNext = false
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
    }
  }
  
  return !inString
}

/**
 * Emergency JSON extraction for severely corrupted data
 */
function extractEmergencyJson(jsonString: string): string {
  try {
    // Try to find any complete JSON object in the corrupted string
    const objectPattern = /\{[^{}]*\}/g
    const matches = jsonString.match(objectPattern)
    
    if (matches && matches.length > 0) {
      // Try each match to see if any are valid JSON
      for (const match of matches) {
        try {
          const testParse = JSON.parse(match)
          console.log('Found valid JSON object in corrupted data:', match)
          return match
        } catch {
          continue
        }
      }
    }
    
    // Try to extract key-value pairs manually
    const keyValuePattern = /(\w+)\s*:\s*([^,}\]]+)/g
    const extracted: any = {}
    let keyMatch
    
    while ((keyMatch = keyValuePattern.exec(jsonString)) !== null) {
      const key = keyMatch[1]
      let value = keyMatch[2].trim()
      
      // Clean up the value
      value = value.replace(/^["']|["']$/g, '') // Remove surrounding quotes
      value = value.replace(/,$/, '') // Remove trailing commas
      
      // Try to parse boolean values
      if (value.toLowerCase() === 'true') {
        extracted[key] = true
      } else if (value.toLowerCase() === 'false') {
        extracted[key] = false
      } else if (!isNaN(Number(value)) && value !== '') {
        extracted[key] = Number(value)
      } else {
        extracted[key] = value
      }
    }
    
    if (Object.keys(extracted).length > 0) {
      console.log('Extracted key-value pairs from corrupted data:', extracted)
      // Safe stringification
      try {
        return JSON.stringify(extracted)
      } catch (stringifyError) {
        console.error('Failed to stringify extracted data:', stringifyError)
        return '{"allowGuestAccess":false,"requireApprovalForJoin":true,"enableFileUploads":true,"maxFileSize":10}'
      }
    }
    
    // If all else fails, return empty object
    return '{}'
  } catch (error) {
    console.error('Emergency extraction failed:', error)
    return '{"allowGuestAccess":false,"requireApprovalForJoin":true,"enableFileUploads":true,"maxFileSize":10}'
  }
}

/**
 * Parse workspace settings safely
 */
export function parseWorkspaceSettings(settings: string | object | null | undefined) {
  const defaultSettings = {
    allowGuestAccess: false,
    requireApprovalForJoin: true,
    enableFileUploads: true,
    maxFileSize: 10,
    defaultTaskVisibility: 'public' as const,
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png']
  }

  if (!settings) {
    return defaultSettings
  }

  try {
    let parsed: any
    
    if (typeof settings === 'string') {
      // Ultimate safety check: if string is too long or contains suspicious patterns, skip JSON parsing
      if (settings.length > 10000 || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(settings)) {
        console.warn('Suspicious JSON string detected, using emergency extraction')
        const emergencyJson = extractEmergencyJson(settings)
        if (emergencyJson !== '{}') {
          try {
            parsed = JSON.parse(emergencyJson)
          } catch {
            return defaultSettings
          }
        } else {
          return defaultSettings
        }
      } else {
        // Try normal parsing path
        const cleanedJson = cleanJsonString(settings)
        if (cleanedJson === '{}') {
          console.warn('JSON cleaning failed, using default settings')
          return defaultSettings
        }
        try {
          parsed = JSON.parse(cleanedJson)
        } catch (parseError) {
          console.error('JSON.parse failed even after cleaning:', parseError)
          console.error('Cleaned JSON:', cleanedJson)
          // Try emergency extraction as last resort
          const emergencyJson = extractEmergencyJson(settings)
          if (emergencyJson !== '{}') {
            try {
              parsed = JSON.parse(emergencyJson)
            } catch {
              return defaultSettings
            }
          } else {
            return defaultSettings
          }
        }
      }
    } else if (typeof settings === 'object') {
      // Already an object, validate it's not null or array
      if (settings === null || Array.isArray(settings)) {
        console.warn('Settings is null or array, using defaults')
        return defaultSettings
      }
      parsed = settings
    } else {
      console.warn('Settings is neither string nor object, using defaults:', typeof settings)
      return defaultSettings
    }
    
    // Validate parsed object
    if (!parsed || typeof parsed !== 'object') {
      console.warn('Parsed settings is not a valid object, using defaults')
      return defaultSettings
    }
    
    return { ...defaultSettings, ...parsed }
  } catch (error) {
    console.error('Unexpected error in parseWorkspaceSettings:', error)
    console.error('Raw settings:', settings)
    return defaultSettings
  }
}

/**
 * Parse security settings safely
 */
export function parseSecuritySettings(security: string | object | null | undefined) {
  const defaultSettings = {
    enableTwoFactor: false,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false
    },
    ipWhitelist: [] as string[],
    auditLogRetention: 90
  }

  if (!security) {
    return defaultSettings
  }

  try {
    let parsed: any
    
    if (typeof security === 'string') {
      // Try to clean the JSON first
      const cleanedJson = cleanJsonString(security)
      if (cleanedJson === '{}') {
        console.warn('JSON cleaning failed for security settings, using defaults')
        return defaultSettings
      }
      try {
        parsed = JSON.parse(cleanedJson)
      } catch (parseError) {
        console.error('JSON.parse failed even after cleaning for security settings:', parseError)
        console.error('Cleaned JSON:', cleanedJson)
        return defaultSettings
      }
    } else if (typeof security === 'object') {
      // Already an object, validate it's not null or array
      if (security === null || Array.isArray(security)) {
        console.warn('Security settings is null or array, using defaults')
        return defaultSettings
      }
      parsed = security
    } else {
      console.warn('Security settings is neither string nor object, using defaults:', typeof security)
      return defaultSettings
    }
    
    // Validate parsed object
    if (!parsed || typeof parsed !== 'object') {
      console.warn('Parsed security settings is not a valid object, using defaults')
      return defaultSettings
    }
    
    return { ...defaultSettings, ...parsed }
  } catch (error) {
    console.error('Unexpected error in parseSecuritySettings:', error)
    console.error('Raw security:', security)
    return defaultSettings
  }
}
