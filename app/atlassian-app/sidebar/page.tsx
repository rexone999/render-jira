"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Sparkles, Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AtlassianSidebarPage() {
  const [brdContent, setBrdContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<any[]>([])
  const [projectKey, setProjectKey] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Get project context and setup Atlassian Connect
    const urlParams = new URLSearchParams(window.location.search)
    const project = urlParams.get("project")
    if (project) {
      setProjectKey(project)
    }

    // Setup Atlassian Connect for sidebar
    if (window.parent !== window) {
      const script = document.createElement("script")
      script.src = "https://connect-cdn.atl-paas.net/all.js"
      script.onload = () => {
        if (window.AP) {
          window.AP.require("resize", (resize) => {
            setIsLoaded(true)

            const resizeToContent = () => {
              const height = Math.max(document.documentElement.scrollHeight, 400)
              resize.to(null, height)
            }

            resizeToContent()

            // Auto-resize on content changes
            const observer = new MutationObserver(resizeToContent)
            observer.observe(document.body, {
              childList: true,
              subtree: true,
            })
          })
        }
      }
      document.head.appendChild(script)
    } else {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    // Resize when stories change
    if (window.AP && window.AP.require) {
      window.AP.require("resize", (resize) => {
        setTimeout(() => {
          const height = Math.max(document.documentElement.scrollHeight, 400)
          resize.to(null, height)
        }, 100)
      })
    }
  }, [generatedStories])

  const generateStories = async () => {
    if (!brdContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter BRD content.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brdContent,
          projectName: `Project ${projectKey}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate stories")
      }

      const data = await response.json()
      setGeneratedStories(data.stories)

      toast({
        title: "Success!",
        description: `Generated ${data.stories.length} stories.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate stories.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const publishToJira = async () => {
    if (generatedStories.length === 0) return

    setIsPublishing(true)
    try {
      const response = await fetch("/api/publish-to-jira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stories: generatedStories,
          projectKey: projectKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to publish stories")
      }

      const data = await response.json()

      toast({
        title: "Published!",
        description: `Published ${data.publishedCount} stories to ${projectKey}.`,
      })

      // Notify Jira to refresh
      if (window.AP && window.AP.require) {
        window.AP.require("events", (events) => {
          events.emit("jira.project.refreshed")
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish stories.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 bg-white">
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="font-medium text-sm text-gray-900">Generate Stories</h3>
          <p className="text-xs text-gray-600">for {projectKey}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brd-input" className="text-xs font-medium">
            BRD Content
          </Label>
          <Textarea
            id="brd-input"
            placeholder="Paste your BRD content here..."
            value={brdContent}
            onChange={(e) => setBrdContent(e.target.value)}
            rows={4}
            className="text-xs"
          />
        </div>

        <Button onClick={generateStories} disabled={isGenerating || !brdContent.trim()} className="w-full" size="sm">
          {isGenerating ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-1 h-3 w-3" />
              Generate
            </>
          )}
        </Button>

        {generatedStories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-700">{generatedStories.length} Stories Ready</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <CheckCircle className="h-2 w-2 mr-1" />
                Ready
              </Badge>
            </div>

            <Button onClick={publishToJira} disabled={isPublishing} variant="outline" className="w-full" size="sm">
              {isPublishing ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-3 w-3" />
                  Publish to Jira
                </>
              )}
            </Button>

            <div className="max-h-32 overflow-y-auto space-y-1">
              {generatedStories.slice(0, 3).map((story, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                  <div className="flex items-center space-x-1 mb-1">
                    <Badge variant={story.type === "epic" ? "default" : "secondary"} className="text-xs px-1 py-0">
                      {story.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="font-medium text-xs line-clamp-1">{story.title}</p>
                </div>
              ))}
              {generatedStories.length > 3 && (
                <p className="text-xs text-gray-500 text-center">+{generatedStories.length - 3} more stories</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
