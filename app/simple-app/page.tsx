"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Zap, CheckCircle, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SimpleAppPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [brdContent, setBrdContent] = useState("")
  const [projectName, setProjectName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("TEST")
  const { toast } = useToast()

  useEffect(() => {
    // Simple iframe resizing without Atlassian Connect
    const resizeIframe = () => {
      if (window.parent !== window) {
        const height = Math.max(document.documentElement.scrollHeight, 600)
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

    // Initial resize
    setTimeout(resizeIframe, 100)

    // Resize on content changes
    const observer = new MutationObserver(resizeIframe)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    // Resize on window resize
    window.addEventListener("resize", resizeIframe)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", resizeIframe)
    }
  }, [activeTab, generatedStories])

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
          projectName: projectName || "Generated Project",
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

      // Switch to stories tab
      setActiveTab("stories")
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
          projectKey: selectedProject,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to publish stories")
      }

      const data = await response.json()

      toast({
        title: "Stories published successfully!",
        description: `Published ${data.publishedCount} stories to Jira.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish stories. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <div>
              <h1 className="font-semibold text-lg">PO Assist</h1>
              <p className="text-xs text-blue-100">AI Story Generation for Jira</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-500 text-white border-blue-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Generate Stories</span>
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Review & Publish</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Generate User Stories</span>
                </CardTitle>
                <CardDescription>
                  Paste your Business Requirements Document content to generate EPICs and user stories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name (Optional)</Label>
                  <input
                    id="project-name"
                    type="text"
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            {generatedStories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Stories Generated Yet</h3>
                  <p className="text-gray-600 text-center">
                    Go to the "Generate Stories" tab and create user stories from your BRD.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Generated Stories ({generatedStories.length})</h3>
                    <p className="text-sm text-gray-600">Review your stories and publish to Jira</p>
                  </div>
                  <Button onClick={publishToJira} className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="mr-2 h-4 w-4" />
                    Publish to Jira
                  </Button>
                </div>

                <div className="space-y-3">
                  {generatedStories.map((story, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant={story.type === "epic" ? "default" : "secondary"}>
                                {story.type.toUpperCase()}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  story.priority === "High"
                                    ? "border-red-200 text-red-700"
                                    : story.priority === "Medium"
                                      ? "border-yellow-200 text-yellow-700"
                                      : "border-green-200 text-green-700"
                                }
                              >
                                {story.priority || "Medium"}
                              </Badge>
                              {story.storyPoints && <Badge variant="outline">{story.storyPoints} pts</Badge>}
                            </div>
                            <CardTitle className="text-base">{story.title || "Untitled Story"}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700">{story.description || "No description provided"}</p>
                          {story.acceptanceCriteria &&
                            Array.isArray(story.acceptanceCriteria) &&
                            story.acceptanceCriteria.length > 0 && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Acceptance Criteria</Label>
                                <ul className="mt-1 space-y-1">
                                  {story.acceptanceCriteria.map((criteria, criteriaIndex) => (
                                    <li key={criteriaIndex} className="text-xs text-gray-600 flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>{criteria}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
