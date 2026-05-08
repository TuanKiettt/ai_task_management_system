export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    if (password.length < 8) errors.push("Password must be at least 8 characters")
    if (!/[A-Z]/.test(password)) errors.push("Must contain uppercase letter")
    if (!/[a-z]/.test(password)) errors.push("Must contain lowercase letter")
    if (!/[0-9]/.test(password)) errors.push("Must contain number")
    return { valid: errors.length === 0, errors }
  },

  taskTitle: (title: string): boolean => {
    return title.trim().length > 0 && title.trim().length <= 200
  },

  taskTime: (time: string): boolean => {
    const timeRegex = /^\d+(\.\d+)?(h|m|s)$/
    return timeRegex.test(time.toLowerCase())
  },

  name: (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 100
  },

  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unknown error occurred"
}
