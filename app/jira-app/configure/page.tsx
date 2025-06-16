"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, CheckCircle, ExternalLink } from "lucide-react"

export default function ConfigurePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)

    // Jira configuration page setup
    if (window.parent !== window) {
      const sendHeight = () => {
        const height = Math.max(document.documentElement.scrollHeight, 600)
        window.parent.postMessage(
          {
            type: "resize",
            height: height,
            source: "po-assist-config",
          },
          "*",
        )
      }

      setTimeout(sendHeight, 100)

      const resizeObserver = new ResizeObserver(sendHeight)
      resizeObserver.observe(document.body)

      return () => resizeObserver.disconnect()
    }
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <header className="bg-white shadow-sm border-b rounded-lg mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PO Assist Configuration</h1>
                <p className="text-sm text-gray-500">Configure your AI Story Generator</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Installed
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Installation Status</span>
              </CardTitle>
              <CardDescription>PO Assist is successfully installed and configured</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Jira Integration</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">AI Engine</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use PO Assist</CardTitle>
              <CardDescription>Access PO Assist features from within Jira</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Main Application</p>
                    <p className="text-sm text-gray-600">
                      Click "PO Assist" in the top navigation to access the full application
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Project Sidebar</p>
                    <p className="text-sm text-gray-600">
                      Look for "AI Stories" panel in the left sidebar when viewing any project
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Generate Stories</p>
                    <p className="text-sm text-gray-600">
                      Paste your BRD content and let AI generate EPICs and user stories
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Publish to Jira</p>
                    <p className="text-sm text-gray-600">
                      Review generated stories and publish them directly to your project backlog
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Direct links to PO Assist features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (window.parent !== window) {
                      window.parent.postMessage({ type: "navigate", url: "/jira-app" }, "*")
                    }
                  }}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Main Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
