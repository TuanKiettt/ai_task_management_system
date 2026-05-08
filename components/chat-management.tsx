"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  Trash2, 
  UserMinus, 
  Crown, 
  Shield,
  AlertTriangle,
  X,
  Settings
} from "lucide-react"

interface ChatMember {
  id: string
  userId: string
  joinedAt: string
  user: {
    id: string
    fullName: string
    email: string
    avatar?: string
  }
}

interface ChatPermissions {
  canDeleteChat: boolean
  canKickMembers: boolean
  isCreator: boolean
  isWorkspaceAdmin: boolean
}

interface ChatInfo {
  id: string
  name: string
  description?: string
  createdBy: string
}

interface ChatManagementProps {
  chatId: string
  workspaceId: string
  userId: string
  onClose: () => void
  onChatDeleted?: () => void
  onMemberKicked?: (memberId: string) => void
}

export function ChatManagement({ 
  chatId, 
  workspaceId, 
  userId, 
  onClose, 
  onChatDeleted, 
  onMemberKicked 
}: ChatManagementProps) {
  const [loading, setLoading] = useState(true)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [members, setMembers] = useState<ChatMember[]>([])
  const [permissions, setPermissions] = useState<ChatPermissions | null>(null)
  const [deletingChat, setDeletingChat] = useState(false)
  const [kickingMember, setKickingMember] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchChatManagementInfo()
  }, [chatId, workspaceId, userId])

  const fetchChatManagementInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/chats/${chatId}/manage?userId=${userId}`
      )

      if (response.ok) {
        const data = await response.json()
        setChatInfo(data.chat)
        setMembers(data.members)
        setPermissions(data.permissions)
      } else {
        console.error('Failed to fetch chat management info')
      }
    } catch (error) {
      console.error('Error fetching chat management info:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteChat = async () => {
    if (!permissions?.canDeleteChat) return

    try {
      setDeletingChat(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/chats/${chatId}/manage?userId=${userId}`,
        {
          method: 'DELETE'
        }
      )

      if (response.ok) {
        console.log('Chat deleted successfully')
        onChatDeleted?.()
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Failed to delete chat:', errorData.error)
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    } finally {
      setDeletingChat(false)
      setShowDeleteConfirm(false)
    }
  }

  const kickMember = async (memberUserId: string) => {
    if (!permissions?.canKickMembers) return

    try {
      setKickingMember(memberUserId)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/chats/${chatId}/manage?userId=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberUserId
          })
        }
      )

      if (response.ok) {
        console.log('Member kicked successfully')
        setMembers(prev => prev.filter(member => member.userId !== memberUserId))
        onMemberKicked?.(memberUserId)
      } else {
        const errorData = await response.json()
        console.error('Failed to kick member:', errorData.error)
      }
    } catch (error) {
      console.error('Error kicking member:', error)
    } finally {
      setKickingMember(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Chat Management</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Chat Info */}
          {chatInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {chatInfo.name}
                </CardTitle>
                {chatInfo.description && (
                  <CardDescription>{chatInfo.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    Created by: {members.find(m => m.userId === chatInfo.createdBy)?.user?.fullName || 'Unknown'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {members.length} members
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permissions */}
          {permissions && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Your Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {permissions.isCreator && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Chat Creator
                  </Badge>
                )}
                {permissions.isWorkspaceAdmin && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Workspace Admin
                  </Badge>
                )}
                {permissions.canDeleteChat && (
                  <Badge variant="outline">Can Delete Chat</Badge>
                )}
                {permissions.canKickMembers && (
                  <Badge variant="outline">Can Kick Members</Badge>
                )}
              </div>
            </div>
          )}

          {/* Members */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Members ({members.length})</h3>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback>
                        {member.user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.user.fullName}</span>
                        {member.userId === chatInfo?.createdBy && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Creator
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.user.email} • Joined {formatDate(member.joinedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {permissions?.canKickMembers && 
                     member.userId !== chatInfo?.createdBy && 
                     member.userId !== userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => kickMember(member.userId)}
                        disabled={kickingMember === member.userId}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {kickingMember === member.userId ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          {permissions?.canDeleteChat && (
            <div className="border-t pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-medium text-red-900">Danger Zone</h3>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  Deleting this chat will permanently remove all messages and member associations. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deletingChat}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Chat
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-700">
                      Are you sure you want to delete this chat? Type "DELETE" to confirm:
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={deleteChat}
                        disabled={deletingChat}
                      >
                        {deletingChat ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          'Confirm Delete'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deletingChat}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
