"use client"

import { useState, useCallback } from "react"
import { useToast } from "./toast-provider"

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: string) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string
}

export function useFormValidator(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const { addToast } = useToast()

  const validateField = useCallback((fieldName: string, value: string): string | null => {
    const rule = rules[fieldName]
    if (!rule) return null

    // Required validation
    if (rule.required && (!value || value.trim() === '')) {
      return `${fieldName} is required`
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      return null
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName} must be at least ${rule.minLength} characters`
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName} must not exceed ${rule.maxLength} characters`
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName} format is invalid`
    }

    // Email validation
    if (rule.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        return `${fieldName} must be a valid email address`
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [rules])

  const validateForm = useCallback((formData: Record<string, string>): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName] || '')
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [rules, validateField])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  }
}

// Common validation rules
export const commonValidationRules = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) {
        return "Password must contain at least one lowercase letter"
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return "Password must contain at least one uppercase letter"
      }
      if (!/(?=.*\d)/.test(value)) {
        return "Password must contain at least one number"
      }
      return null
    },
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
}

// Form field component with validation
interface ValidatedFieldProps {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  type?: string
  multiline?: boolean
}

export function ValidatedField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  type = "text",
  multiline = false,
}: ValidatedFieldProps) {
  const Component = multiline ? "textarea" : "input"

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Component
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-2 border rounded-md ${
          error ? "border-red-500" : "border-gray-300"
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        rows={multiline ? 4 : undefined}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
