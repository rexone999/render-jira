"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Send, Edit, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { JiraSuccessModal } from "@/components/jira-success-modal"
import { ProjectSelector } from "@/components/project-selector"

interface UserStory {
  id: string
  type: "epic" | "story"
  title: string
  description: string
  acceptanceCriteria: string[]
  priority: "High" | "Medium" | "Low"
  storyPoints?: number
  published?: boolean
}

interface UserStoryManagerProps {
  stories: UserStory[]
  jiraContext: any | null
  isInJira: boolean
}

export function UserStoryManager({ stories, jiraContext, isInJira }: UserStoryManagerProps) {
  const [selectedStories, setSelectedStories] = useState<string[]>([])
  const [editingStory, setEditingStory] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [publishedStories, setPublishedStories] = useState<any[]>([])
  const [projectKey, setProjectKey] = useState<string>("")
  const { toast } = useToast()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const handleStorySelect = (storyId: string, checked: boolean) => {
    if (checked) {
      setSelectedStories([...selectedStories, storyId])
    } else {
      setSelectedStories(selectedStories.filter((id) => id !== storyId))
    }
  }

  const handleEditStory = (story: UserStory) => {
    setEditingStory(story.id)
    setEditedContent(story.description)
  }

  const saveEdit = () => {
    // In a real app, you'd update the story in your state management
    setEditingStory(null)
    setEditedContent("")
    toast({
      title: "Story updated",
      description: "Your changes have been saved.",
    })
  }

  const publishToJira = async () => {
    if (selectedStories.length === 0) {
      toast({
        title: "No stories selected",
        description: "Please select at least one story to publish.",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)
    try {
      const storiesToPublish = stories.filter((story) => selectedStories.includes(story.id))

      // Validate and clean stories before sending
      const cleanedStories = storiesToPublish.map((story) => ({
        ...story,
        title: story.title || "Untitled Story",
        description: story.description || "No description provided",
        priority: story.priority || "Medium",
        acceptanceCriteria: Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [],
        storyPoints: typeof story.storyPoints === "number" ? story.storyPoints : undefined,
      }))

      const response = await fetch("/api/publish-to-jira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stories: cleanedStories,
          projectKey: selectedProject, // Add this line
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to publish stories")
      }

      const data = await response.json()

      // Set data for success modal
      setPublishedStories(data.stories || cleanedStories)
      setProjectKey(data.projectKey || "")
      setShowSuccessModal(true)

      toast({
        title: "Stories published successfully!",
        description: data.message || `Published ${data.publishedCount} stories to Jira backlog.`,
      })

      setSelectedStories([])
    } catch (error) {
      console.error("Publish error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish stories to Jira. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  if (stories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Stories Generated Yet</h3>
          <p className="text-gray-600 text-center">Upload a BRD and generate user stories to see them here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <ProjectSelector selectedProject={selectedProject} onProjectSelect={setSelectedProject} />
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Generated Stories ({stories.length})</h3>
            <p className="text-sm text-gray-600">Review and select stories to publish to Jira</p>
          </div>
          <Button
            onClick={publishToJira}
            disabled={selectedStories.length === 0 || isPublishing || !selectedProject}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Publish to Jira ({selectedStories.length})
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4">
          {stories.map((story) => (
            <Card key={story.id} className={`${selectedStories.includes(story.id) ? "ring-2 ring-blue-500" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedStories.includes(story.id)}
                      onCheckedChange={(checked) => handleStorySelect(story.id, checked as boolean)}
                    />
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
                        {story.published && (
                          <Badge variant="outline" className="border-green-200 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{story.title || "Untitled Story"}</CardTitle>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditStory(story)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {editingStory === story.id ? (
                  <div className="space-y-3">
                    <Label>Description</Label>
                    <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={3} />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingStory(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">{story.description || "No description provided"}</p>
                    {story.acceptanceCriteria &&
                      Array.isArray(story.acceptanceCriteria) &&
                      story.acceptanceCriteria.length > 0 && (
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Acceptance Criteria</Label>
                          <ul className="mt-1 space-y-1">
                            {story.acceptanceCriteria.map((criteria, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start">
                                <span className="mr-2">•</span>
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <JiraSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        publishedStories={publishedStories}
        projectKey={projectKey}
      />
    </>
  )
}
