"use client"

import type React from "react"
import { Component } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] Error caught by boundary:", error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-900/20 border border-red-700/50 rounded-2xl text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-white font-semibold mb-2">Something went wrong</h3>
            <p className="text-red-200 text-sm mb-4">{this.state.error?.message}</p>
            <Button onClick={this.resetError} className="bg-red-600 hover:bg-red-700 gap-2">
              <RotateCcw className="w-4 h-4" />
              Try again
            </Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
