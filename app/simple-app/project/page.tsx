"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Sparkles, Loader2, FileText, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SimpleProjectPage() {
  const [brdContent, setBrdContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<any[]>([])
  const [projectKey, setProjectKey] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Get project context from URL
    const urlParams = new URLSearchParams(window.location.search)
    const project = urlParams.get("project")
    if (project) {
      setProjectKey(project)
    }

    // Simple iframe resizing
    const resizeIframe = () => {
      if (window.parent !== window) {
        const height = Math.max(document.documentElement.scrollHeight, 400)
        try {
          window.parent.postMessage(
            {
              type: "resize",
              height: height,
            },
            "*",
          )
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
    }

    setTimeout(resizeIframe, 100)

    const observer = new MutationObserver(resizeIframe)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
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

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Generate Stories for {projectKey}</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Paste your BRD content to generate EPICs and User Stories for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brd-content" className="text-sm font-medium">
              Business Requirements Document
            </Label>
            <Textarea
              id="brd-content"
              placeholder="Paste your Business Requirements Document content here..."
              value={brdContent}
              onChange={(e) => setBrdContent(e.target.value)}
              rows={6}
              className="text-sm"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={generateStories}
              disabled={isGenerating || !brdContent.trim()}
              className="flex-1"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Stories
                </>
              )}
            </Button>

            {generatedStories.length > 0 && (
              <Button onClick={publishToJira} disabled={isPublishing} variant="outline" size="sm">
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
            )}
          </div>

          {generatedStories.length > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Generated {generatedStories.length} Stories</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {generatedStories.map((story, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border text-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={story.type === "epic" ? "default" : "secondary"} className="text-xs">
                        {story.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {story.priority}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm">{story.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{story.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
