"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BRDUploaderProps {
  onStoriesGenerated: (stories: any[]) => void
}

export function BRDUploader({ onStoriesGenerated }: BRDUploaderProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [brdContent, setBrdContent] = useState("")
  const [projectName, setProjectName] = useState("")
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBrdContent(e.target?.result as string)
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been loaded.`,
        })
      }
      reader.readAsText(file)
    }
  }

  const generateStories = async () => {
    if (!brdContent.trim()) {
      toast({
        title: "Error",
        description: "Please upload a BRD or enter content manually.",
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
          projectName: projectName || "Untitled Project",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate stories")
      }

      const data = await response.json()
      onStoriesGenerated(data.stories)

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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload BRD</span>
          </CardTitle>
          <CardDescription>Upload your Business Requirements Document or paste the content directly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload BRD File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>

          <div className="text-center text-gray-500">
            <span>or</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brd-content">Paste BRD Content</Label>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>How it Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                1
              </div>
              <div>
                <p className="font-medium">Upload or Paste BRD</p>
                <p className="text-sm text-gray-600">Provide your Business Requirements Document content</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                2
              </div>
              <div>
                <p className="font-medium">AI Analysis</p>
                <p className="text-sm text-gray-600">
                  Our AI analyzes the requirements and generates structured EPICs and user stories
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                3
              </div>
              <div>
                <p className="font-medium">Review & Edit</p>
                <p className="text-sm text-gray-600">
                  Review generated stories, make edits, and select which ones to publish
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 text-xs font-bold min-w-[24px] h-6 flex items-center justify-center">
                4
              </div>
              <div>
                <p className="font-medium">Publish to Jira</p>
                <p className="text-sm text-gray-600">Directly publish selected stories to your Jira backlog</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
