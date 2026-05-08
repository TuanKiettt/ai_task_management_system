"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Paperclip, 
  X, 
  Download, 
  File, 
  FileText, 
  Image, 
  Archive,
  Music,
  Video,
  FileSpreadsheet,
  Presentation,
  Trash2
} from "lucide-react"
import { useAttachments, type Attachment } from "@/context/attachment-context"
import { useUser } from "@/context/user-context"
import { formatDistanceToNow } from "date-fns"

interface TaskAttachmentsProps {
  taskId: string
  className?: string
}

export function TaskAttachments({ taskId, className }: TaskAttachmentsProps) {
  const { 
    attachments, 
    uploadAttachment, 
    downloadAttachment, 
    deleteAttachment, 
    getAttachmentsByTask, 
    formatFileSize, 
    getFileIcon, 
    isImageFile,
    isPdfFile,
    loading 
  } = useAttachments()
  
  const { userData } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const taskAttachments = getAttachmentsByTask(taskId)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await uploadAttachment(taskId, file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Reset after a short delay
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 1000)
    } catch (error) {
      console.error('Failed to upload file:', error)
      setUploading(false)
      setUploadProgress(0)
      alert('Failed to upload file')
    }
  }

  const handleDownload = (attachment: Attachment) => {
    downloadAttachment(attachment.id)
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Are you sure you want to delete "${attachment.fileName}"?`)) return

    try {
      await deleteAttachment(attachment.id)
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      alert('Failed to delete file')
    }
  }

  const getFileIconComponent = (fileType: string) => {
    const IconComponent = getFileIcon(fileType)
    return <IconComponent className="w-4 h-4" />
  }

  const canDelete = (attachment: Attachment) => {
    return userData?.id === attachment.userId
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          <h3 className="font-semibold">Attachments ({taskAttachments.length})</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Attach File'}
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments List */}
      <div className="space-y-2">
        {taskAttachments.map((attachment) => (
          <Card key={attachment.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {isImageFile(attachment.fileType) ? (
                  <div className="w-10 h-10 rounded border overflow-hidden bg-muted">
                    <img 
                      src={`/api/attachments/${attachment.id}/download`}
                      alt={attachment.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center">
                    {getFileIconComponent(attachment.fileType)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{attachment.fileName}</h4>
                  {isPdfFile(attachment.fileType) && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">PDF</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>Uploaded {formatDistanceToNow(attachment.uploadedAt, { addSuffix: true })}</span>
                  {attachment.user && (
                    <>
                      <span>•</span>
                      <span>by {attachment.user.fullName}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(attachment)}
                  className="h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                {canDelete(attachment) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(attachment)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {taskAttachments.length === 0 && !uploading && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No attachments yet</p>
            <p className="text-xs">Click "Attach File" to add files</p>
          </div>
        )}

        {loading && taskAttachments.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Loading attachments...
          </div>
        )}
      </div>
    </div>
  )
}
