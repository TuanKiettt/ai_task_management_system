'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkspace } from '@/context/workspace-context'
import { useUser } from '@/context/user-context'
import { X, Mail, UserPlus } from 'lucide-react'

interface InviteMembersModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteMembersModal({ isOpen, onClose }: InviteMembersModalProps) {
  const { currentWorkspace, inviteMembers } = useWorkspace()
  const { userId } = useUser()
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emails.trim() || !currentWorkspace || !userId) return

    try {
      setLoading(true)
      setError(null)

      const emailList = emails.split(',').map(email => email.trim()).filter(email => email)
      
      if (emailList.length === 0) {
        setError('Please enter at least one email address')
        return
      }

      await inviteMembers(currentWorkspace.id, emailList.map(email => ({ email, role })))
      
      // Reset form
      setEmails('')
      setRole('member')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Invite Members
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="emails">Email Addresses</Label>
              <Input
                id="emails"
                type="text"
                placeholder="Enter email addresses, separated by commas"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate multiple emails with commas
              </p>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitations
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
