"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  UserPlus, 
  Mail, 
  Copy, 
  Check, 
  Users,
  Crown,
  Shield,
  User
} from "lucide-react"
import { useWorkspace } from "@/context/workspace-context"
import type { WorkspaceRole } from "@/context/workspace-context"

interface WorkspaceInviteProps {
  workspaceId: string
  className?: string
}

const ROLE_DESCRIPTIONS = {
  owner: {
    icon: Crown,
    label: "Owner",
    description: "Full control over workspace settings, billing, and members",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  admin: {
    icon: Shield,
    label: "Admin",
    description: "Manage projects, tasks, and members (no billing access)",
    color: "bg-blue-100 text-blue-800 border-blue-200"
  },
  member: {
    icon: User,
    label: "Member",
    description: "Create and edit tasks, view projects",
    color: "bg-green-100 text-green-800 border-green-200"
  }
}

export function WorkspaceInvite({ workspaceId, className }: WorkspaceInviteProps) {
  const { inviteMembers, invitations, currentWorkspace } = useWorkspace()
  const [mounted, setMounted] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [emailList, setEmailList] = useState<{ email: string; role: WorkspaceRole }[]>([])
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>("member")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && workspaceId) {
      setInviteLink(`${window.location.origin}/invite/${workspaceId}`)
    }
  }, [mounted, workspaceId])

  const addEmail = () => {
    const email = emailInput.trim()
    if (!email || !email.includes("@")) return

    // Check if email already exists
    if (emailList.some(item => item.email === email)) return

    setEmailList([...emailList, { email, role: selectedRole }])
    setEmailInput("")
  }

  const removeEmail = (emailToRemove: string) => {
    setEmailList(emailList.filter(item => item.email !== emailToRemove))
  }

  const changeEmailRole = (email: string, newRole: WorkspaceRole) => {
    setEmailList(emailList.map(item => 
      item.email === email ? { ...item, role: newRole } : item
    ))
  }

  const handleSendInvitations = async () => {
    if (emailList.length === 0) return

    try {
      setIsInviting(true)
      await inviteMembers(workspaceId, emailList)
      setEmailList([])
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to send invitations:", error)
    } finally {
      setIsInviting(false)
    }
  }

  const generateInviteLink = () => {
    if (!currentWorkspace) return ""
    return `${window.location.origin}/invite/${workspaceId}`
  }

  const copyInviteLink = async () => {
    const link = generateInviteLink()
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleEmailInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      addEmail()
    }
  }

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite to Workspace</DialogTitle>
            <DialogDescription>
              Invite team members to collaborate in your workspace
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email Invitations</TabsTrigger>
              <TabsTrigger value="link">Invite Link</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              {/* Add Email Section */}
              <div className="space-y-3">
                <Label htmlFor="email-input">Email Addresses</Label>
                <div className="flex gap-2">
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="Enter email address..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={handleEmailInputKeyPress}
                    disabled={isInviting}
                  />
                  <Select value={selectedRole} onValueChange={(value: WorkspaceRole) => setSelectedRole(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_DESCRIPTIONS).map(([role, config]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addEmail} disabled={!emailInput.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Email List */}
              {emailList.length > 0 && (
                <div className="space-y-2">
                  <Label>Invitation List ({emailList.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {emailList.map((item) => (
                      <div key={item.email} className="flex items-center gap-2 p-2 border rounded-lg">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{item.email}</span>
                        <Select 
                          value={item.role} 
                          onValueChange={(value: WorkspaceRole) => changeEmailRole(item.email, value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_DESCRIPTIONS).map(([role, config]) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <config.icon className="w-3 h-3" />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmail(item.email)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Role Information */}
              <div className="space-y-2">
                <Label>Role Permissions</Label>
                <div className="grid gap-2">
                  {Object.entries(ROLE_DESCRIPTIONS).map(([role, config]) => (
                    <Card key={role} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg border ${config.color}`}>
                          <config.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{config.label}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-3">
                <Label>Share Invite Link</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with this link can join your workspace as a member.
                </p>
                
                <div className="flex gap-2">
                  <Input
                    value={generateInviteLink()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={copyInviteLink}
                    className="min-w-[100px]"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Link invitations will join as members by default</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            {emailList.length > 0 && (
              <Button onClick={handleSendInvitations} disabled={isInviting}>
                {isInviting ? "Sending..." : `Send ${emailList.length} Invitation${emailList.length > 1 ? 's' : ''}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
