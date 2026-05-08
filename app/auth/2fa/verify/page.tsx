"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  Smartphone, 
  Key, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft
} from "lucide-react"

export default function TwoFactorVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const userIdParam = searchParams.get('userId')
    const emailParam = searchParams.get('email')
    
    if (!userIdParam || !emailParam) {
      router.push('/auth/login')
      return
    }
    
    setUserId(userIdParam)
    setEmail(emailParam)
  }, [searchParams, router])

  const verifyWithTOTP = async () => {
    if (!userId || verificationCode.length !== 6) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          token: verificationCode,
          useBackupCode: false
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to dashboard with success
        router.push('/')
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const verifyWithBackupCode = async () => {
    if (!userId || backupCode.length !== 8) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          token: backupCode,
          useBackupCode: true
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show warning about backup code usage
        if (data.usedBackupCode) {
          alert("Backup code used successfully. Consider regenerating your backup codes for security.")
        }
        router.push('/')
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/auth/login')
  }

  if (!userId || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Enter your verification code for {email}
          </p>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackToLogin}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Verification Form */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="totp" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="totp" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  App Code
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Backup Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="totp" className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>
                
                <div>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <Button 
                  onClick={verifyWithTOTP}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </TabsContent>
              
              <TabsContent value="backup" className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Use a backup code only if you can't access your authenticator app. 
                    Each code can only be used once.
                  </AlertDescription>
                </Alert>

                <div>
                  <Input
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={backupCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Z0-9-]/g, '').toUpperCase()
                      if (value.length <= 9) { // XXXX-XXXX format
                        setBackupCode(value)
                      }
                    }}
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={9}
                  />
                </div>

                <Button 
                  onClick={verifyWithBackupCode}
                  disabled={loading || backupCode.length !== 9}
                  className="w-full"
                  variant="outline"
                >
                  {loading ? "Verifying..." : "Use Backup Code"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Having trouble?{' '}
            <button 
              onClick={() => router.push('/auth/forgot-password')}
              className="text-violet-600 hover:text-violet-700 underline"
            >
              Reset your password
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
