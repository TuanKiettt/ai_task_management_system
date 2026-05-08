"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "./user-context"

export interface Attachment {
  id: string
  taskId: string
  userId: string
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  uploadedAt: Date
  user?: {
    id: string
    fullName: string
    email: string
    avatar?: string
  }
}

interface AttachmentContextType {
  attachments: Attachment[]
  loading: boolean
  error: string | null
  
  // Attachment management
  uploadAttachment: (taskId: string, file: File) => Promise<Attachment>
  downloadAttachment: (attachmentId: string) => Promise<void>
  deleteAttachment: (attachmentId: string) => Promise<void>
  
  // Utility functions
  getAttachmentsByTask: (taskId: string) => Attachment[]
  refreshAttachments: (taskId?: string) => Promise<void>
  
  // File utilities
  formatFileSize: (bytes: number) => string
  getFileIcon: (fileType: string) => React.ElementType
  isImageFile: (fileType: string) => boolean
  isPdfFile: (fileType: string) => boolean
}

const AttachmentContext = createContext<AttachmentContextType | undefined>(undefined)

export function AttachmentProvider({ children }: { children: React.ReactNode }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useUser()

  const getCurrentUserId = () => {
    return userId || "demo-user"
  }

  // Fetch attachments for a task
  const fetchAttachments = useCallback(async (taskId?: string) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      let url = `/api/attachments?userId=${getCurrentUserId()}`
      if (taskId) {
        url += `&taskId=${taskId}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch attachments')
      }

      const attachmentsData = await response.json()
      
      // Convert date strings to Date objects
      const attachmentsWithDates = attachmentsData.map((attachment: any) => ({
        ...attachment,
        uploadedAt: new Date(attachment.uploadedAt),
      }))

      if (taskId) {
        // Replace attachments for specific task
        setAttachments(prev => [
          ...prev.filter(a => a.taskId !== taskId),
          ...attachmentsWithDates
        ])
      } else {
        // Replace all attachments
        setAttachments(attachmentsWithDates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attachments')
      console.error('Error fetching attachments:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Upload attachment
  const uploadAttachment = useCallback(async (taskId: string, file: File) => {
    try {
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('taskId', taskId)
      formData.append('userId', getCurrentUserId())

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload attachment')
      }

      const newAttachment = await response.json()
      
      // Convert date strings to Date objects
      const attachmentWithDates = {
        ...newAttachment,
        uploadedAt: new Date(newAttachment.uploadedAt),
      }

      setAttachments(prev => [attachmentWithDates, ...prev])
      return attachmentWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment')
      console.error('Error uploading attachment:', err)
      throw err
    }
  }, [])

  // Download attachment
  const downloadAttachment = useCallback(async (attachmentId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/attachments/${attachmentId}/download`)
      if (!response.ok) {
        throw new Error('Failed to download attachment')
      }

      // Get the blob
      const blob = await response.blob()
      
      // Get the attachment details for filename
      const attachment = attachments.find(a => a.id === attachmentId)
      const filename = attachment?.fileName || 'download'

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download attachment')
      console.error('Error downloading attachment:', err)
      throw err
    }
  }, [attachments])

  // Delete attachment
  const deleteAttachment = useCallback(async (attachmentId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }

      setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attachment')
      console.error('Error deleting attachment:', err)
      throw err
    }
  }, [])

  // Get attachments by task
  const getAttachmentsByTask = useCallback((taskId: string) => {
    return attachments.filter(attachment => attachment.taskId === taskId)
  }, [attachments])

  // Refresh attachments
  const refreshAttachments = useCallback(async (taskId?: string) => {
    await fetchAttachments(taskId)
  }, [fetchAttachments])

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Get file icon based on type
  const getFileIcon = useCallback((fileType: string): React.ElementType => {
    // Import icons dynamically to avoid circular dependencies
    const icons = {
      // Images
      'image/jpeg': () => require('lucide-react').Image,
      'image/jpg': () => require('lucide-react').Image,
      'image/png': () => require('lucide-react').Image,
      'image/gif': () => require('lucide-react').Image,
      'image/webp': () => require('lucide-react').Image,
      'image/svg+xml': () => require('lucide-react').Image,
      
      // Documents
      'application/pdf': () => require('lucide-react').FileText,
      'application/msword': () => require('lucide-react').FileText,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': () => require('lucide-react').FileText,
      'application/vnd.ms-excel': () => require('lucide-react').FileSpreadsheet,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': () => require('lucide-react').FileSpreadsheet,
      'application/vnd.ms-powerpoint': () => require('lucide-react').FilePresentation,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': () => require('lucide-react').FilePresentation,
      
      // Text
      'text/plain': () => require('lucide-react').FileText,
      'text/csv': () => require('lucide-react').FileSpreadsheet,
      'text/html': () => require('lucide-react').FileText,
      'text/css': () => require('lucide-react').FileText,
      'text/javascript': () => require('lucide-react').FileText,
      'application/json': () => require('lucide-react').FileText,
      
      // Archives
      'application/zip': () => require('lucide-react').Archive,
      'application/x-rar-compressed': () => require('lucide-react').Archive,
      'application/x-7z-compressed': () => require('lucide-react').Archive,
      'application/gzip': () => require('lucide-react').Archive,
      
      // Audio
      'audio/mpeg': () => require('lucide-react').Music,
      'audio/wav': () => require('lucide-react').Music,
      'audio/ogg': () => require('lucide-react').Music,
      'audio/mp4': () => require('lucide-react').Music,
      
      // Video
      'video/mp4': () => require('lucide-react').Video,
      'video/mpeg': () => require('lucide-react').Video,
      'video/quicktime': () => require('lucide-react').Video,
      'video/x-msvideo': () => require('lucide-react').Video,
      
      // Default
      default: () => require('lucide-react').File,
    }
    
    const iconFunction = icons[fileType as keyof typeof icons] || icons.default
    return iconFunction()
  }, [])

  // Check if file is image
  const isImageFile = useCallback((fileType: string): boolean => {
    return fileType.startsWith('image/')
  }, [])

  // Check if file is PDF
  const isPdfFile = useCallback((fileType: string): boolean => {
    return fileType === 'application/pdf'
  }, [])

  const contextValue: AttachmentContextType = useMemo(() => ({
    attachments,
    loading,
    error,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment,
    getAttachmentsByTask,
    refreshAttachments,
    formatFileSize,
    getFileIcon,
    isImageFile,
    isPdfFile,
  }), [
    attachments,
    loading,
    error,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment,
    getAttachmentsByTask,
    refreshAttachments,
    formatFileSize,
    getFileIcon,
    isImageFile,
    isPdfFile,
  ])

  return (
    <AttachmentContext.Provider value={contextValue}>
      {children}
    </AttachmentContext.Provider>
  )
}

export function useAttachments() {
  const context = useContext(AttachmentContext)
  if (context === undefined) {
    throw new Error('useAttachments must be used within an AttachmentProvider')
  }
  return context
}
