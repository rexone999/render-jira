"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Zap, Sparkles, Loader2, Upload, FileText, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function JiraEmbedPage() {
  const [brdContent, setBrdContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // ✅ Immediate load to prevent timeout
    setIsLoaded(true)

    // ✅ Optimized iframe communication
    const sendHeight = () => {
      if (window.parent !== window) {
        try {
          const height = Math.max(document.documentElement.scrollHeight, 600)
          window.parent.postMessage(
            {
              type: "resize",
              height: height,
              source: "po-assist",
            },
            "*",
          )
        } catch (e) {
          console.log("Cross-origin message blocked (expected)")
        }
      }
    }

    // Send initial height
    setTimeout(sendHeight, 100)

    // Monitor size changes
    const resizeObserver = new ResizeObserver(sendHeight)
    resizeObserver.observe(document.body)
    resizeObserver.observe(document.documentElement)

    // Cleanup
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Resize when content changes
  useEffect(() => {
    if (window.parent !== window) {
      setTimeout(() => {
        const height = Math.max(document.documentElement.scrollHeight, 600)
        window.parent.postMessage({ type: "resize", height, source: "po-assist" }, "*")
      }, 100)
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brdContent,
          projectName: "Generated Project",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate")

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: generatedStories,
          projectKey: "TEST",
        }),
      })

      if (!response.ok) throw new Error("Failed to publish")

      const data = await response.json()
      toast({
        title: "Published!",
        description: `Published ${data.publishedCount} stories.`,
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

  // ✅ Fast loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading PO Assist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 min-h-screen">
      {/* Compact header for iframe */}
      <div className="bg-blue-600 text-white p-3 rounded-lg mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <div>
            <h1 className="font-semibold">PO Assist</h1>
            <p className="text-xs text-blue-100">AI Story Generator for Jira</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {/* Input section */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Requirements Document</label>
            <Textarea
              placeholder="Paste your BRD content here to generate EPICs and user stories..."
              value={brdContent}
              onChange={(e) => setBrdContent(e.target.value)}
              rows={6}
              className="w-full"
            />
          </div>

          <Button onClick={generateStories} disabled={isGenerating || !brdContent.trim()} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Stories...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate EPICs & User Stories
              </>
            )}
          </Button>
        </div>

        {/* Results section */}
        {generatedStories.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Generated {generatedStories.length} Stories</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to Publish
                </Badge>
              </div>
              <Button onClick={publishToJira} disabled={isPublishing} size="sm">
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
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {generatedStories.map((story, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={story.type === "epic" ? "default" : "secondary"} className="text-xs">
                      {story.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {story.priority}
                    </Badge>
                    {story.storyPoints && (
                      <Badge variant="outline" className="text-xs">
                        {story.storyPoints} pts
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-sm mb-1">{story.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{story.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
