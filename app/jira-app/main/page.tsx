"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MessageSquare, FileText, Zap, CheckCircle, Settings } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import { UserStoryManager } from "@/components/user-story-manager"
import { BRDUploader } from "@/components/brd-uploader"
import { JiraTestPanel } from "@/components/jira-test-panel"

export default function JiraMainPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [generatedStories, setGeneratedStories] = useState([])
  const [jiraContext, setJiraContext] = useState<any>(null)

  useEffect(() => {
    // Get JWT and context from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const jwt = urlParams.get("jwt")

    if (jwt) {
      setJiraContext({ jwt })
    }

    // Auto-resize for Jira iframe
    const resizeObserver = new ResizeObserver(() => {
      if (window.parent !== window) {
        const height = Math.max(document.documentElement.scrollHeight, 800)
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

    // Initial resize
    setTimeout(() => {
      if (window.parent !== window) {
        const height = Math.max(document.documentElement.scrollHeight, 800)
        window.parent.postMessage(
          {
            type: "resize",
            height: height,
          },
          "*",
        )
      }
    }, 100)

    return () => {
      resizeObserver.disconnect()
    }
  }, [activeTab, generatedStories])

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Header for Jira */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">PO Assist</h1>
              <p className="text-sm text-blue-100">AI-Powered Story Generation</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Jira Connected
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transform BRDs into Actionable Stories</h2>
          <p className="text-gray-600">
            Upload your Business Requirements Document and let AI generate EPICs and user stories for your Jira backlog.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload BRD</span>
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Stories</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <BRDUploader onStoriesGenerated={setGeneratedStories} />
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            <UserStoryManager stories={generatedStories} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <ChatInterface onStoriesGenerated={setGeneratedStories} />
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <JiraTestPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
