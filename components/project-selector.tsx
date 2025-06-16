"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderOpen, Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Project {
  key: string
  name: string
  id: string
  projectTypeKey?: string
  lead?: string
}

interface ProjectSelectorProps {
  selectedProject: string | null
  onProjectSelect: (projectKey: string) => void
}

export function ProjectSelector({ selectedProject, onProjectSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectKey, setNewProjectKey] = useState("")
  const [createError, setCreateError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/get-jira-projects")
      const data = await response.json()

      if (data.success) {
        setProjects(data.projects)
        // Auto-select first project if none selected
        if (!selectedProject && data.projects.length > 0) {
          onProjectSelect(data.projects[0].key)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Jira",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateProjectKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 10)
  }

  const handleProjectNameChange = (name: string) => {
    setNewProjectName(name)
    setNewProjectKey(generateProjectKey(name))
    setCreateError("")
  }

  const createNewProject = async () => {
    if (!newProjectName.trim() || !newProjectKey.trim()) {
      setCreateError("Please enter project name and key")
      return
    }

    setIsCreating(true)
    setCreateError("")

    try {
      const response = await fetch("/api/create-jira-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: newProjectName,
          projectKey: newProjectKey,
          projectType: "software",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Project created successfully!",
          description: `${data.project.name} (${data.project.key}) has been created.`,
        })

        await fetchProjects()
        onProjectSelect(data.project.key)
        setShowCreateDialog(false)
        setNewProjectName("")
        setNewProjectKey("")
        setCreateError("")
      } else {
        setCreateError(data.details || "Failed to create project")
      }
    } catch (error) {
      setCreateError("Network error: Failed to create project")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Project:</span>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Jira Project</DialogTitle>
              <DialogDescription>Create a new project for your generated stories</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {createError && (
                <div className="bg-red-50 p-2 rounded border border-red-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{createError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Food Delivery App"
                  value={newProjectName}
                  onChange={(e) => handleProjectNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-key">Project Key</Label>
                <Input
                  id="project-key"
                  placeholder="e.g., FDA"
                  value={newProjectKey}
                  onChange={(e) => {
                    setNewProjectKey(e.target.value.toUpperCase())
                    setCreateError("")
                  }}
                  maxLength={10}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setCreateError("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createNewProject}
                  disabled={isCreating || !newProjectName.trim() || !newProjectKey.trim()}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-2 flex items-center space-x-2">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <>
            <Select value={selectedProject || ""} onValueChange={onProjectSelect}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Choose project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.key} value={project.key}>
                    <span className="font-medium">{project.key}</span> - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProject && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </>
        )}
      </div>
    </div>
  )
}
