"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle, FileText, Layers } from "lucide-react"

interface JiraSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  publishedStories: any[]
  projectKey?: string
}

export function JiraSuccessModal({ isOpen, onClose, publishedStories, projectKey }: JiraSuccessModalProps) {
  const jiraBaseUrl = "https://projectmajorvd25.atlassian.net"

  const openJiraBacklog = () => {
    if (projectKey) {
      window.open(`${jiraBaseUrl}/jira/software/projects/${projectKey}/backlog`, "_blank")
    } else {
      window.open(`${jiraBaseUrl}/jira/your-work`, "_blank")
    }
  }

  const openSpecificIssue = (jiraKey: string) => {
    window.open(`${jiraBaseUrl}/browse/${jiraKey}`, "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Stories Published Successfully!</span>
          </DialogTitle>
          <DialogDescription>
            {publishedStories.length} stories have been created in your Jira backlog. Here's where to find them:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Access Buttons */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-3">🚀 Quick Access</h3>
            <div className="space-y-2">
              <Button onClick={openJiraBacklog} className="w-full justify-start" variant="outline">
                <Layers className="h-4 w-4 mr-2" />
                Open Project Backlog
              </Button>
              <Button
                onClick={() => window.open(`${jiraBaseUrl}/jira/your-work`, "_blank")}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                View All Your Issues
              </Button>
            </div>
          </div>

          {/* Published Stories List */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800">📋 Published Stories</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {publishedStories.map((story, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Badge variant={story.type === "epic" ? "default" : "secondary"}>{story.type.toUpperCase()}</Badge>
                    <div>
                      <p className="font-medium text-sm">{story.title}</p>
                      {story.jiraKey && <p className="text-xs text-gray-600">Jira Key: {story.jiraKey}</p>}
                    </div>
                  </div>
                  {story.jiraKey && (
                    <Button size="sm" variant="ghost" onClick={() => openSpecificIssue(story.jiraKey)}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">📍 Where to Find Your Stories</h3>
            <div className="text-sm text-green-700 space-y-2">
              <p>
                <strong>1. Project Backlog:</strong> Go to your project → Backlog tab
              </p>
              <p>
                <strong>2. Board View:</strong> Go to your project → Board (if using Scrum/Kanban)
              </p>
              <p>
                <strong>3. Issues Search:</strong> Use "Issues" → "Search for Issues"
              </p>
              <p>
                <strong>4. Your Work:</strong> Check "Your Work" for all assigned issues
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={openJiraBacklog}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Jira Backlog
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
