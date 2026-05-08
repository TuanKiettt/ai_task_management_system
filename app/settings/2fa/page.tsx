"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Key, 
  Smartphone, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw
} from "lucide-react"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"

interface TwoFactorStatus {
  enabled: boolean
  createdAt?: string
  lastUsedAt?: string
  backupCodesCount: number
  backupCodesTotal: number
}

export default function TwoFactorSettingsPage() {
  const router = useRouter()
  const { userData } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [regeneratingCodes, setRegeneratingCodes] = useState(false)

  useEffect(() => {
    if (!userData) {
      router.push("/auth/login")
      return
    }
    fetchTwoFactorStatus()
  }, [userData])

  const fetchTwoFactorStatus = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/auth/2fa?userId=${userData.id}`)
      const data = await response.json()

      if (response.ok) {
        setTwoFactorStatus(data)
      } else {
        setError(data.error || "Failed to fetch 2FA status")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setError("Please enter your password")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          password: disablePassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("2FA has been disabled successfully")
        setShowDisableDialog(false)
        setDisablePassword("")
        fetchTwoFactorStatus()
      } else {
        setError(data.error || "Failed to disable 2FA")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!disablePassword) {
      setError("Please enter your password to regenerate backup codes")
      return
    }

    setRegeneratingCodes(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          password: disablePassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        setSuccess("New backup codes generated successfully")
        setDisablePassword("")
        fetchTwoFactorStatus()
      } else {
        setError(data.error || "Failed to regenerate backup codes")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setRegeneratingCodes(false)
    }
  }

  const downloadBackupCodes = () => {
    if (backupCodes.length === 0) return

    const content = `AI Task Extraction - Backup Codes\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `User: ${userData?.email}\n\n` +
      `Keep these codes safe. Each code can only be used once.\n\n` +
      backupCodes.map((code, index) => 
        `${index + 1}. ${code.slice(0, 4)}-${code.slice(4)}`
      ).join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-codes-${userData?.email}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess("Copied to clipboard")
      setTimeout(() => setSuccess(""), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard")
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Manage your 2FA settings and backup codes
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* 2FA Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {twoFactorStatus?.enabled ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  2FA is Enabled
                </>
              ) : (
                <>
                  <ShieldX className="w-5 h-5 text-red-600" />
                  2FA is Disabled
                </>
              )}
            </CardTitle>
            <CardDescription>
              {twoFactorStatus?.enabled 
                ? "Your account is protected with two-factor authentication"
                : "Your account is not protected with two-factor authentication"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <p>Loading...</p>
              </div>
            ) : twoFactorStatus?.enabled ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Enabled Since:</span>
                    <p className="font-medium">
                      {twoFactorStatus.createdAt 
                        ? new Date(twoFactorStatus.createdAt).toLocaleDateString()
                        : "Unknown"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Used:</span>
                    <p className="font-medium">
                      {twoFactorStatus.lastUsedAt 
                        ? new Date(twoFactorStatus.lastUsedAt).toLocaleDateString()
                        : "Never"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Backup Codes:</span>
                    <p className="font-medium">
                      {twoFactorStatus.backupCodesCount} / {twoFactorStatus.backupCodesTotal} available
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {showBackupCodes ? "Hide" : "Show"} Backup Codes
                  </Button>
                  
                  <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disable 2FA
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                          This will remove the extra security layer from your account. Are you sure you want to continue?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Enter your password</label>
                          <Input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={handleDisable2FA}
                            disabled={loading}
                          >
                            {loading ? "Disabling..." : "Disable 2FA"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDisableDialog(false)
                              setDisablePassword("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShieldX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Enable two-factor authentication to add an extra layer of security to your account
                </p>
                <Button onClick={() => router.push("/auth/2fa/setup")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Codes Section */}
        {twoFactorStatus?.enabled && showBackupCodes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Backup Codes
              </CardTitle>
              <CardDescription>
                Save these codes somewhere safe. Each code can only be used once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupCodes.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center justify-between font-mono text-sm">
                        <span>{index + 1}. {code.slice(0, 4)}-{code.slice(4)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadBackupCodes}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Codes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Enter your password to view your backup codes
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <Button
                      onClick={handleRegenerateBackupCodes}
                      disabled={regeneratingCodes || !disablePassword}
                    >
                      {regeneratingCodes ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          View Backup Codes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Setup Instructions */}
        {!twoFactorStatus?.enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                How to Set Up 2FA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-violet-600 font-bold">1</span>
                    </div>
                    <h4 className="font-medium">Install App</h4>
                    <p className="text-sm text-muted-foreground">
                      Download Google Authenticator, Microsoft Authenticator, or Authy
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-violet-600 font-bold">2</span>
                    </div>
                    <h4 className="font-medium">Scan QR Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Scan the QR code with your authenticator app
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-violet-600 font-bold">3</span>
                    </div>
                    <h4 className="font-medium">Enter Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code to verify and enable 2FA
                    </p>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <Button onClick={() => router.push("/auth/2fa/setup")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
