"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  BellOff, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff,
  Keyboard,
  MessageSquare,
  Palette,
  Settings,
  Trash2,
  AlertTriangle
} from "lucide-react"

interface ChatSettings {
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
    mobile: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
    messageSize: 'small' | 'medium' | 'large'
    showTimestamps: boolean
    showAvatars: boolean
  }
  behavior: {
    typingIndicators: boolean
    readReceipts: boolean
    onlineStatus: boolean
    enterToSend: boolean
  }
}

export function ChatSettings({ 
  onClose, 
  chatId, 
  workspaceId, 
  userId,
  onChatDeleted 
}: { 
  onClose: () => void
  chatId?: string
  workspaceId?: string
  userId?: string
  onChatDeleted?: () => void
}) {
  const [settings, setSettings] = useState<ChatSettings>({
    notifications: {
      enabled: true,
      sound: true,
      desktop: true,
      mobile: false
    },
    appearance: {
      theme: 'system',
      messageSize: 'medium',
      showTimestamps: true,
      showAvatars: true
    },
    behavior: {
      typingIndicators: true,
      readReceipts: false,
      onlineStatus: true,
      enterToSend: false
    }
  })

  const [activeTab, setActiveTab] = useState<'notifications' | 'appearance' | 'behavior' | 'management'>('notifications')
  const [canDeleteChat, setCanDeleteChat] = useState(false)
  const [canEditChat, setCanEditChat] = useState(false)
  const [deletingChat, setDeletingChat] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingChat, setEditingChat] = useState(false)
  const [chatName, setChatName] = useState('')
  const [chatDescription, setChatDescription] = useState('')
  const [updatingChat, setUpdatingChat] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('chat-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to parse chat settings:', error)
      }
    }
  }, [])

  // Check chat management permissions
  useEffect(() => {
    if (chatId && workspaceId && userId) {
      checkChatPermissions()
    }
  }, [chatId, workspaceId, userId])

  const checkChatPermissions = async () => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/chats/${chatId}/manage?userId=${userId}`
      )
      if (response.ok) {
        const data = await response.json()
        setCanDeleteChat(data.permissions.canDeleteChat)
        setCanEditChat(data.permissions.canEditChat)
        setChatName(data.chat.name)
        setChatDescription(data.chat.description || '')
      }
    } catch (error) {
      console.error('Error checking chat permissions:', error)
    }
  }

  const updateChat = async () => {
    if (!chatId || !workspaceId || !userId || !chatName.trim()) return

    try {
      setUpdatingChat(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/chats/${chatId}/manage?userId=${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: chatName.trim(),
            description: chatDescription.trim() || null
          })
        }
      )

      if (response.ok) {
        console.log('Chat updated successfully')
        setEditingChat(false)
        // Refresh chat info
        checkChatPermissions()
      } else {
        const errorData = await response.json()
        console.error('Failed to update chat:', errorData.error)
      }
    } catch (error) {
      console.error('Error updating chat:', error)
    } finally {
      setUpdatingChat(false)
    }
  }

  const deleteChat = async () => {
    if (!chatId || !workspaceId || !userId) return

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

  // Save settings to localStorage
  const saveSettings = (newSettings: ChatSettings) => {
    setSettings(newSettings)
    localStorage.setItem('chat-settings', JSON.stringify(newSettings))
  }

  const updateSetting = (category: keyof ChatSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    }
    saveSettings(newSettings)
  }

  const resetSettings = () => {
    const defaultSettings: ChatSettings = {
      notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        mobile: false
      },
      appearance: {
        theme: 'system',
        messageSize: 'medium',
        showTimestamps: true,
        showAvatars: true
      },
      behavior: {
        typingIndicators: true,
        readReceipts: false,
        onlineStatus: true,
        enterToSend: false
      }
    }
    saveSettings(defaultSettings)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Chat Settings</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 border-r bg-gray-50">
            <div className="p-4">
              <div className="space-y-2">
                <Button
                  variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button
                  variant={activeTab === 'appearance' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('appearance')}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Appearance
                </Button>
                <Button
                  variant={activeTab === 'behavior' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('behavior')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Behavior
                </Button>
                {chatId && (
                  <Button
                    variant={activeTab === 'management' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('management')}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Management
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Enable Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications for new messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifications.enabled}
                        onCheckedChange={(checked) => updateSetting('notifications', 'enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Sound Effects</Label>
                          <p className="text-sm text-gray-500">Play sound for new messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifications.sound}
                        onCheckedChange={(checked) => updateSetting('notifications', 'sound', checked)}
                        disabled={!settings.notifications.enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Desktop Notifications</Label>
                          <p className="text-sm text-gray-500">Show desktop notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifications.desktop}
                        onCheckedChange={(checked) => updateSetting('notifications', 'desktop', checked)}
                        disabled={!settings.notifications.enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellOff className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Mobile Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications on mobile</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifications.mobile}
                        onCheckedChange={(checked) => updateSetting('notifications', 'mobile', checked)}
                        disabled={!settings.notifications.enabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Appearance Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium mb-2 block">Theme</Label>
                      <Select 
                        value={settings.appearance.theme} 
                        onValueChange={(value: 'light' | 'dark' | 'system') => 
                          updateSetting('appearance', 'theme', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-medium mb-2 block">Message Size</Label>
                      <Select 
                        value={settings.appearance.messageSize} 
                        onValueChange={(value: 'small' | 'medium' | 'large') => 
                          updateSetting('appearance', 'messageSize', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Show Timestamps</Label>
                          <p className="text-sm text-gray-500">Display message timestamps</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.appearance.showTimestamps}
                        onCheckedChange={(checked) => updateSetting('appearance', 'showTimestamps', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Show Avatars</Label>
                          <p className="text-sm text-gray-500">Display user avatars</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.appearance.showAvatars}
                        onCheckedChange={(checked) => updateSetting('appearance', 'showAvatars', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'behavior' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Behavior Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Keyboard className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Typing Indicators</Label>
                          <p className="text-sm text-gray-500">Show when someone is typing</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.behavior.typingIndicators}
                        onCheckedChange={(checked) => updateSetting('behavior', 'typingIndicators', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Read Receipts</Label>
                          <p className="text-sm text-gray-500">Show when messages are read</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.behavior.readReceipts}
                        onCheckedChange={(checked) => updateSetting('behavior', 'readReceipts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Online Status</Label>
                          <p className="text-sm text-gray-500">Show when users are online</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.behavior.onlineStatus}
                        onCheckedChange={(checked) => updateSetting('behavior', 'onlineStatus', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Keyboard className="w-4 h-4" />
                        <div>
                          <Label className="font-medium">Enter to Send</Label>
                          <p className="text-sm text-gray-500">Press Enter to send messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.behavior.enterToSend}
                        onCheckedChange={(checked) => updateSetting('behavior', 'enterToSend', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'management' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Chat Management</h3>
                  
                  {/* Edit Chat Section */}
                  {canEditChat && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-base">Edit Chat Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="font-medium mb-2 block">Chat Name</Label>
                          <Input
                            value={chatName}
                            onChange={(e) => setChatName(e.target.value)}
                            placeholder="Enter chat name"
                            disabled={!editingChat}
                          />
                        </div>
                        <div>
                          <Label className="font-medium mb-2 block">Description (Optional)</Label>
                          <textarea
                            value={chatDescription}
                            onChange={(e) => setChatDescription(e.target.value)}
                            placeholder="Enter chat description"
                            className="w-full p-2 border rounded-md resize-none"
                            rows={3}
                            disabled={!editingChat}
                          />
                        </div>
                        <div className="flex gap-2">
                          {!editingChat ? (
                            <Button onClick={() => setEditingChat(true)}>
                              Edit Chat
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={updateChat}
                                disabled={!chatName.trim() || updatingChat}
                              >
                                {updatingChat ? (
                                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                ) : null}
                                Save Changes
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingChat(false)
                                  // Reset to original values
                                  checkChatPermissions()
                                }}
                                disabled={updatingChat}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Delete Chat Section */}
                  {(canDeleteChat || canEditChat) ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-medium text-red-900">Danger Zone</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-4">
                        Deleting this chat will permanently remove all messages and member associations. This action cannot be undone.
                      </p>
                      {canDeleteChat && (
                        <>
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
                                Are you sure you want to delete this chat? This action cannot be undone.
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
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h4 className="font-medium text-gray-900 mb-2">No Management Permissions</h4>
                      <p className="text-sm text-gray-500">
                        You don't have permission to manage this chat. Only chat creators and workspace admins can manage chats.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={resetSettings}>
            Reset to Default
          </Button>
          <Button onClick={onClose}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
