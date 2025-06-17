"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MessageSquare, FileText, Zap, CheckCircle } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import { UserStoryManager } from "@/components/user-story-manager"
import { BRDUploader } from "@/components/brd-uploader"

export default function AtlassianAppPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [generatedStories, setGeneratedStories] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Atlassian Connect iframe setup
    const setupAtlassianConnect = () => {
      // Check if we're in an Atlassian iframe
      if (window.parent !== window) {
        // Load Atlassian Connect JavaScript API
        const script = document.createElement("script")
        script.src = "https://connect-cdn.atl-paas.net/all.js"
        script.onload = () => {
          // Initialize Atlassian Connect
          if (window.AP) {
            window.AP.require("request", (request) => {
              // Atlassian Connect is ready
              setIsLoaded(true)

              // Auto-resize iframe
              window.AP.require("resize", (resize) => {
                const resizeToContent = () => {
                  const height = Math.max(document.documentElement.scrollHeight, 800)
                  resize.to(null, height)
                }

                resizeToContent()

                // Resize on content changes
                const observer = new MutationObserver(resizeToContent)
                observer.observe(document.body, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                })
              })
            })
          }
        }
        document.head.appendChild(script)
      } else {
        // Not in iframe, set as loaded
        setIsLoaded(true)
      }
    }

    setupAtlassianConnect()
  }, [])

  useEffect(() => {
    // Resize when tab or stories change
    if (window.AP && window.AP.require) {
      window.AP.require("resize", (resize) => {
        setTimeout(() => {
          const height = Math.max(document.documentElement.scrollHeight, 800)
          resize.to(null, height)
        }, 100)
      })
    }
  }, [activeTab, generatedStories])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PO Assist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Header for Jira iframe */}
      <div className="bg-blue-600 text-white p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <div>
              <h1 className="font-semibold">PO Assist</h1>
              <p className="text-xs text-blue-100">AI Story Generation</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-500 text-white border-blue-400 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center space-x-1 text-sm">
              <Upload className="h-3 w-3" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center space-x-1 text-sm">
              <FileText className="h-3 w-3" />
              <span>Stories</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-1 text-sm">
              <MessageSquare className="h-3 w-3" />
              <span>Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <BRDUploader onStoriesGenerated={setGeneratedStories} />
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            <UserStoryManager stories={generatedStories} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <ChatInterface onStoriesGenerated={setGeneratedStories} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
