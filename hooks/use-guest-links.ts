import { useState, useEffect } from "react"

interface GuestLink {
  id: string
  title: string
  url: string
  description: string
  isActive: boolean
  expiresAt?: string
  accessCount: number
  maxAccess?: number
  password?: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

interface UseGuestLinksReturn {
  links: GuestLink[]
  loading: boolean
  error: string | null
  createLink: (linkData: Partial<GuestLink>) => Promise<void>
  updateLink: (id: string, linkData: Partial<GuestLink>) => Promise<void>
  deleteLink: (id: string) => Promise<void>
  toggleLink: (id: string) => Promise<void>
  refreshLinks: () => Promise<void>
}

export function useGuestLinks(userId?: string): UseGuestLinksReturn {
  const [links, setLinks] = useState<GuestLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLinks = async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/guest-links?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setLinks(data.links.map((link: any) => ({
          ...link,
          permissions: JSON.parse(link.permissions || '["view"]')
        })))
      } else {
        setError(data.error || "Failed to fetch links")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const createLink = async (linkData: Partial<GuestLink>) => {
    if (!userId) return
    
    try {
      const response = await fetch("/api/guest-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...linkData, userId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchLinks() // Refresh list
      } else {
        setError(data.error || "Failed to create link")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  const updateLink = async (id: string, linkData: Partial<GuestLink>) => {
    try {
      const response = await fetch(`/api/guest-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setLinks(prev => prev.map(link => 
          link.id === id ? { ...link, ...linkData } : link
        ))
      } else {
        setError(data.error || "Failed to update link")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  const deleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/guest-links/${id}`, {
        method: "DELETE"
      })
      
      const data = await response.json()
      
      if (data.success) {
        setLinks(prev => prev.filter(link => link.id !== id))
      } else {
        setError(data.error || "Failed to delete link")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  const toggleLink = async (id: string) => {
    const link = links.find(l => l.id === id)
    if (link) {
      await updateLink(id, { isActive: !link.isActive })
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [userId])

  return {
    links,
    loading,
    error,
    createLink,
    updateLink,
    deleteLink,
    toggleLink,
    refreshLinks: fetchLinks
  }
}
