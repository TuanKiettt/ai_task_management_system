"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Link, 
  Share2, 
  Copy, 
  Eye, 
  EyeOff, 
  Calendar,
  Users,
  Settings,
  Trash2,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { useGuestLinks } from "@/hooks/use-guest-links"
import { useUser } from "@/context/user-context"

export function GuestLinks() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const { userId } = useUser()
  const { links, loading, error, deleteLink, toggleLink } = useGuestLinks(userId || undefined)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading guest links...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <span className="ml-2 text-red-600">Error: {error}</span>
      </div>
    )
  }

  const copyToClipboard = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLinkId(linkId)
      setTimeout(() => setCopiedLinkId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getExpirationStatus = (expiresAt?: string) => {
    if (!expiresAt) return { status: "never", color: "bg-gray-100 text-gray-700", text: "Never" }
    
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "bg-red-100 text-red-700", text: "Expired" }
    } else if (daysUntilExpiry <= 7) {
      return { status: "expiring", color: "bg-orange-100 text-orange-700", text: `${daysUntilExpiry} days` }
    } else {
      return { status: "active", color: "bg-green-100 text-green-700", text: `${daysUntilExpiry} days` }
    }
  }

  const getAccessStatus = (accessCount: number, maxAccess?: number) => {
    if (!maxAccess) return { percentage: 0, status: "unlimited" }
    
    const percentage = (accessCount / maxAccess) * 100
    if (percentage >= 90) return { percentage, status: "critical" }
    if (percentage >= 70) return { percentage, status: "warning" }
    return { percentage, status: "good" }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-violet-600" />
            Guest Links
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Share secure links with external users without requiring login
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Link className="w-4 h-4 mr-2" />
          Create Link
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {links.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {links.filter(l => l.isActive).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {links.reduce((sum, link) => sum + link.accessCount, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {links.filter(l => l.password).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Password Protected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {links.map((link) => {
          const expirationStatus = getExpirationStatus(link.expiresAt)
          const accessStatus = getAccessStatus(link.accessCount, link.maxAccess)
          
          return (
            <Card key={link.id} className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {link.title}
                      </h3>
                      {link.isActive && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </Badge>
                      )}
                      {link.password && (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          <Shield className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {link.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        value={link.url}
                        readOnly
                        className="font-mono text-sm bg-gray-50 dark:bg-[#2d3548] border-gray-200 dark:border-[#2d3548]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.url, link.id)}
                        className="shrink-0"
                      >
                        {copiedLinkId === link.id ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm text-gray-900 dark:text-white">{link.createdAt}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Expires</p>
                          <Badge className={expirationStatus.color}>
                            {expirationStatus.text}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Access</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {link.accessCount}{link.maxAccess ? `/${link.maxAccess}` : ""}
                            </span>
                            {link.maxAccess && (
                              <div className="w-16 h-2 bg-gray-200 dark:bg-[#2d3548] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    accessStatus.status === "critical" ? "bg-red-500" :
                                    accessStatus.status === "warning" ? "bg-orange-500" : "bg-green-500"
                                  }`}
                                  style={{ width: `${accessStatus.percentage}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Permissions:</span>
                      {link.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleLink(link.id)}
                    >
                      {link.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteLink(link.id)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Form Modal - Placeholder */}
      {showCreateForm && (
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Guest Link
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Advanced link creation interface coming soon. For now, contact admin to create secure guest links.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateForm(false)} variant="outline">
              Cancel
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              Contact Admin
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
