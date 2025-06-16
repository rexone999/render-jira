"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Upload, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function JiraEmbedPanel() {
  const [brdContent, setBrdContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<any[]>([])
  const [projectKey, setProjectKey] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Get project from URL
    const urlParams = new URLSearchParams(window.location.search)
    const project = urlParams.get("project")
    if (project) setProjectKey(project)

    // Quick iframe sizing
    const sendHeight = () => {
      if (window.parent !== window) {
        const height = Math.max(document.body.scrollHeight, 300)
        window.parent.postMessage({ height }, "*")
      }
    }

    sendHeight()
    const observer = new ResizeObserver(sendHeight)
    observer.observe(document.body)

    return () => observer.disconnect()
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brdContent,
          projectName: `Project ${projectKey}`,
        }),
      })

      if (!response.ok) throw new Error("Failed")

      const data = await response.json()
      setGeneratedStories(data.stories)

      toast({
        title: "Success!",
        description: `Generated ${data.stories.length} stories.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate.",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: generatedStories,
          projectKey: projectKey || "TEST",
        }),
      })

      if (!response.ok) throw new Error("Failed")

      const data = await response.json()
      toast({
        title: "Published!",
        description: `Published ${data.publishedCount} stories to ${projectKey}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="bg-white p-3">
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="font-medium text-sm">AI Stories</h3>
          <p className="text-xs text-gray-600">for {projectKey}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">BRD Content</label>
          <Textarea
            placeholder="Paste BRD here..."
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
              <span className="text-xs font-medium text-green-700">{generatedStories.length} Stories</span>
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
                <p className="text-xs text-gray-500 text-center">+{generatedStories.length - 3} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
