'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/context/user-context'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function InvitePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userId } = useUser()
  
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [workspaceName, setWorkspaceName] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      try {
        const { workspaceId: id } = await params
        const tokenParam = searchParams.get('token')
        
        if (!id || !tokenParam) {
          setError('Invalid invitation link')
          setLoading(false)
          return
        }

        setWorkspaceId(id)
        setToken(tokenParam)

        // Validate invitation
        const response = await fetch(`/api/workspaces/${id}/invitations/validate?token=${tokenParam}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid or expired invitation')
          setLoading(false)
          return
        }

        setWorkspaceName(data.workspaceName)
        setLoading(false)
      } catch (err) {
        setError('Failed to validate invitation')
        setLoading(false)
      }
    }

    init()
  }, [params, searchParams])

  const handleAcceptInvitation = async () => {
    if (!userId || !workspaceId || !token) {
      setError('Missing required information')
      return
    }

    try {
      setAccepting(true)
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/workspace/${workspaceId}`)
        }, 2000)
      } else {
        setError(data.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center space-y-2">
              <XCircle className="h-12 w-12 text-red-500" />
              <CardTitle className="text-center">Invitation Invalid</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <CardTitle className="text-center">Invitation Accepted!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-6">
              You have successfully joined "{workspaceName}"
            </p>
            <p className="text-center text-sm text-gray-500">
              Redirecting to workspace...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Join Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              You have been invited to join:
            </p>
            <h3 className="text-xl font-semibold text-gray-900">
              {workspaceName}
            </h3>
          </div>

          {!userId ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Please sign in to accept this invitation
              </p>
              <Button 
                onClick={() => router.push(`/auth/login?redirect=/invite/${workspaceId}?token=${token}`)}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
