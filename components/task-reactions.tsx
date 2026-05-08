"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Smile, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  Laugh,
  Flame,
  Rocket,
  Star,
  Check
} from "lucide-react"
import { useReactions } from "@/context/reaction-context"
import { useUser } from "@/context/user-context"

interface TaskReactionsProps {
  taskId: string
  className?: string
}

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "💯", "👏", "🚀", "😂", "🤔", "👀", "💪"]

export function TaskReactions({ taskId, className }: TaskReactionsProps) {
  const { 
    addReaction, 
    removeReaction, 
    getTaskReactionCounts, 
    getUserReaction,
    commonEmojis 
  } = useReactions()
  
  const { userData } = useUser()
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const reactionCounts = getTaskReactionCounts(taskId)
  const userReaction = getUserReaction(taskId)

  const handleReactionClick = async (emoji: string) => {
    if (!userData) return

    try {
      if (userReaction?.emoji === emoji) {
        // Remove reaction if user already reacted with this emoji
        await removeReaction(taskId, emoji)
      } else {
        // Add new reaction
        await addReaction(taskId, emoji)
      }
    } catch (error) {
      console.error('Failed to handle reaction:', error)
    }
  }

  const getEmojiIcon = (emoji: string) => {
    const iconMap: Record<string, React.ElementType> = {
      "👍": ThumbsUp,
      "❤️": Heart,
      "😊": Smile,
      "🎉": Rocket,
      "🔥": Flame,
      "💯": Star,
      "👏": Check,
      "🚀": Rocket,
      "😂": Laugh,
      "🤔": Smile,
      "👀": Smile,
      "💪": Check,
    }
    
    return iconMap[emoji] || Smile
  }

  const hasReacted = (emoji: string) => {
    return userReaction?.emoji === emoji
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Display existing reactions */}
      {Object.entries(reactionCounts).map(([emoji, count]) => {
        const IconComponent = getEmojiIcon(emoji)
        const userHasReacted = hasReacted(emoji)
        
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
              userHasReacted 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            <span className="text-sm">{emoji}</span>
            <span>{count}</span>
          </button>
        )
      })}

      {/* Emoji picker button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="h-8 w-8 p-0"
        >
          <Smile className="w-4 h-4" />
        </Button>
        
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-background border rounded-lg shadow-lg z-10">
            <div className="grid grid-cols-4 gap-1">
              {COMMON_EMOJIS.map(emoji => {
                const userHasReacted = hasReacted(emoji)
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReactionClick(emoji)
                      setShowEmojiPicker(false)
                    }}
                    className={`p-2 hover:bg-muted rounded text-lg transition-colors ${
                      userHasReacted ? "bg-primary/20 border border-primary/30" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reaction count summary */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="text-xs text-muted-foreground">
          {Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)} reactions
        </div>
      )}
    </div>
  )
}
