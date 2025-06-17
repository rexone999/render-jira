"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, CheckCircle, Save, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { JiraTestPanel } from "@/components/jira-test-panel"

export default function JiraAdminPage() {
  const [jiraConfig, setJiraConfig] = useState({
    baseUrl: "",
    email: "",
    apiToken: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Auto-resize for Jira iframe
    const resizeObserver = new ResizeObserver(() => {
      if (window.parent !== window) {
        const height = Math.max(document.documentElement.scrollHeight, 600)
        window.parent.postMessage(
          {
            type: "resize",
            height: height,
          },
          "*",
        )
      }
    })

    resizeObserver.observe(document.body)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const saveConfiguration = async () => {
    setIsSaving(true)
    try {
      // In a real app, you'd save this to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Configuration saved",
        description: "Your Jira configuration has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">PO Assist Configuration</h1>
            <p className="text-sm text-blue-100">Manage your AI Story Generator settings</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>App Status</span>
            </CardTitle>
            <CardDescription>Current status of PO Assist integration</CardDescription>
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

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Jira Configuration</CardTitle>
            <CardDescription>Configure your Jira connection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base-url">Jira Base URL</Label>
              <Input
                id="base-url"
                placeholder="https://your-domain.atlassian.net"
                value={jiraConfig.baseUrl}
                onChange={(e) => setJiraConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@domain.com"
                value={jiraConfig.email}
                onChange={(e) => setJiraConfig((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-token">API Token</Label>
              <Input
                id="api-token"
                type="password"
                placeholder="Your Jira API Token"
                value={jiraConfig.apiToken}
                onChange={(e) => setJiraConfig((prev) => ({ ...prev, apiToken: e.target.value }))}
              />
            </div>
            <Button onClick={saveConfiguration} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Connection Test</span>
            </CardTitle>
            <CardDescription>Test your Jira API connection</CardDescription>
          </CardHeader>
          <CardContent>
            <JiraTestPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
