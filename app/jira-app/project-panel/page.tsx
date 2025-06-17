"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Sparkles, Loader2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProjectPanelPage() {
  const [brdContent, setBrdContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
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

    // Resize iframe to fit content
    if (window.parent !== window) {
      const resizeIframe = () => {
        const height = Math.max(document.body.scrollHeight, 600)
        window.parent.postMessage(
          {
            type: "resize",
            height: height,
          },
          "*",
        )
      }

      resizeIframe()
      setTimeout(resizeIframe, 100) // Resize after content loads
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
        title: "Stories generated successfully!",
        description: `Generated ${data.stories.length} user stories and EPICs.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate stories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const publishToJira = async () => {
    if (generatedStories.length === 0) {
      toast({
        title: "No stories to publish",
        description: "Please generate stories first.",
        variant: "destructive",
      })
      return
    }

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
        title: "Stories published successfully!",
        description: `Published ${data.publishedCount} stories to ${projectKey}.`,
      })

      // Refresh the parent page to show new issues
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: "refresh",
          },
          "*",
        )
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish stories. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4 bg-white min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Generate Stories for {projectKey}</span>
          </CardTitle>
          <CardDescription>
            Paste your BRD content below to generate EPICs and User Stories for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brd-content">Business Requirements Document</Label>
            <Textarea
              id="brd-content"
              placeholder="Paste your Business Requirements Document content here..."
              value={brdContent}
              onChange={(e) => setBrdContent(e.target.value)}
              rows={8}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={generateStories} disabled={isGenerating || !brdContent.trim()} className="flex-1">
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
              <Button onClick={publishToJira} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Publish to {projectKey}
              </Button>
            )}
          </div>

          {generatedStories.length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Generated {generatedStories.length} Stories</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {generatedStories.map((story, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={story.type === "epic" ? "default" : "secondary"}>
                        {story.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{story.priority}</Badge>
                    </div>
                    <h4 className="font-medium text-sm">{story.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{story.description}</p>
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
