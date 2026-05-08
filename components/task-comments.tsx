"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Send, 
  Edit2, 
  Trash2, 
  Smile,
  Heart,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { useComments, type Comment } from "@/context/comment-context"
import { useUser } from "@/context/user-context"
import { formatDistanceToNow } from "date-fns"

interface TaskCommentsProps {
  taskId: string
  className?: string
}

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "💯", "👏", "🚀"]

export function TaskComments({ taskId, className }: TaskCommentsProps) {
  const { comments, addComment, updateComment, deleteComment, addCommentReaction, removeCommentReaction, getCommentsByTask, loading } = useComments()
  const { userData } = useUser()
  
  const [newComment, setNewComment] = useState("")
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)

  const taskComments = getCommentsByTask(taskId)

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !userData) return

    try {
      setIsSubmitting(true)
      await addComment(taskId, newComment.trim())
      setNewComment("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      await updateComment(commentId, editContent.trim())
      setEditingComment(null)
      setEditContent("")
    } catch (error) {
      console.error("Failed to edit comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
  }

  const handleAddReaction = async (commentId: string, emoji: string) => {
    try {
      await addCommentReaction(commentId, emoji)
      setShowEmojiPicker(null)
    } catch (error) {
      console.error("Failed to add reaction:", error)
    }
  }

  const handleRemoveReaction = async (commentId: string, emoji: string) => {
    try {
      await removeCommentReaction(commentId, emoji)
    } catch (error) {
      console.error("Failed to remove reaction:", error)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditContent("")
  }

  const getUserReactions = (comment: Comment) => {
    if (!comment.reactions || !userData) return []
    return comment.reactions.filter(r => r.userId === userData.id)
  }

  const getReactionCount = (comment: Comment, emoji: string) => {
    if (!comment.reactions) return 0
    return comment.reactions.filter(r => r.emoji === emoji).length
  }

  const hasReacted = (comment: Comment, emoji: string) => {
    return getUserReactions(comment).some(r => r.emoji === emoji)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        <h3 className="font-semibold">Comments ({taskComments.length})</h3>
      </div>

      {/* Add Comment */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={userData?.avatar} />
            <AvatarFallback>
              {userData?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {taskComments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.user?.avatar} />
              <AvatarFallback>
                {comment.user?.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.user?.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>

              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                  {/* Reactions */}
                  {comment.reactions && comment.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {COMMON_EMOJIS.map(emoji => {
                        const count = getReactionCount(comment, emoji)
                        const hasUserReacted = hasReacted(comment, emoji)
                        
                        if (count === 0) return null
                        
                        return (
                          <button
                            key={emoji}
                            onClick={() => hasUserReacted 
                              ? handleRemoveReaction(comment.id, emoji)
                              : handleAddReaction(comment.id, emoji)
                            }
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                              hasUserReacted 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "bg-background hover:bg-muted border-border"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)}
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      
                      {showEmojiPicker === comment.id && (
                        <div className="absolute bottom-full left-0 mb-2 p-2 bg-background border rounded-lg shadow-lg z-10">
                          <div className="grid grid-cols-4 gap-1">
                            {COMMON_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction(comment.id, emoji)}
                                className="p-2 hover:bg-muted rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {userData && comment.userId === userData.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(comment)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {taskComments.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-4 text-muted-foreground">
            Loading comments...
          </div>
        )}
      </div>
    </div>
  )
}
