"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  QRCode, 
  Shield, 
  Smartphone, 
  Key, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  EyeOff
} from "lucide-react"
import { useUser } from "@/context/user-context"

interface TOTPSetup {
  qrCode: string
  secret: string
  manualEntryKey: string
  backupCodes: string[]
}

export default function TwoFactorSetupPage() {
  const router = useRouter()
  const { userData } = useUser()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [downloadedCodes, setDownloadedCodes] = useState(false)

  useEffect(() => {
    if (!userData) {
      router.push("/auth/login")
      return
    }
    generateTOTPSetup()
  }, [userData])

  const generateTOTPSetup = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id })
      })

      const data = await response.json()

      if (response.ok) {
        setTotpSetup(data)
        setStep(2)
      } else {
        setError(data.error || "Failed to setup 2FA")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || !totpSetup) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/auth/2fa/setup?secret=${encodeURIComponent(totpSetup.secret)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: userData.id, 
          token: verificationCode 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStep(3)
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: "secret" | "code") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "secret") {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      }
    } catch (error) {
      console.error("Failed to copy to clipboard")
    }
  }

  const downloadBackupCodes = () => {
    if (!totpSetup) return

    const content = `AI Task Extraction - Backup Codes\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `User: ${userData?.email}\n\n` +
      `Keep these codes safe. Each code can only be used once.\n\n` +
      totpSetup.backupCodes.map((code, index) => 
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

    setDownloadedCodes(true)
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Set Up Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= stepNumber 
                  ? "bg-violet-600 text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {step > stepNumber ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 3 && (
                <div className={cn(
                  "w-12 h-1 mx-2",
                  step > stepNumber ? "bg-violet-600" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Generate Setup */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Configure Your Authenticator App
              </CardTitle>
              <CardDescription>
                We'll generate a secret key for your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Recommended Authenticator Apps:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Google Authenticator</li>
                    <li>• Microsoft Authenticator</li>
                    <li>• Authy</li>
                    <li>• 1Password</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={generateTOTPSetup}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Generating..." : "Generate Setup Code"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Scan QR Code */}
        {step === 2 && totpSetup && (
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Scan this QR code with your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="qr" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="qr">QR Code</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                
                <TabsContent value="qr" className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <img 
                        src={totpSetup.qrCode} 
                        alt="QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Can't scan? Try the manual entry tab
                  </p>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Secret Key</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={totpSetup.manualEntryKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(totpSetup.manualEntryKey, "secret")}
                      >
                        {copiedSecret ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Copy this key and enter it manually in your authenticator app
                  </p>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="mt-1 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={verifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Enable 2FA"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success & Backup Codes */}
        {step === 3 && totpSetup && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                2FA Enabled Successfully!
              </CardTitle>
              <CardDescription>
                Save your backup codes in case you lose access to your authenticator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Save these backup codes somewhere safe. 
                  Each code can only be used once.
                </AlertDescription>
              </Alert>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Backup Codes</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {showBackupCodes && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    {totpSetup.backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center justify-between font-mono text-sm">
                        <span>{index + 1}. {code.slice(0, 4)}-{code.slice(4)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code, "code")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={downloadBackupCodes}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadedCodes ? "Downloaded" : "Download Codes"}
                </Button>
                <Button 
                  onClick={() => router.push("/settings")}
                  className="flex-1"
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
