"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Bot, User, Loader2, FileText, ArrowRight, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProjectSelector } from "@/components/project-selector"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  stories?: any[]
  isStoryGeneration?: boolean
}

interface ChatInterfaceProps {
  onStoriesGenerated?: (stories: any[]) => void
}

export function ChatInterface({ onStoriesGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your PO Assist AI. I can help you with questions about product management, user stories, EPICs, and general project guidance. You can also paste your BRD content and ask me to generate user stories from it. How can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [publishingStories, setPublishingStories] = useState<string | null>(null)
  const { toast } = useToast()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const detectStoryGenerationRequest = (message: string): boolean => {
    const keywords = [
      "generate user stories",
      "create user stories",
      "generate stories",
      "create stories",
      "generate epics",
      "create epics",
      "user story",
      "epic",
      "brd",
      "business requirements",
      "requirements document",
    ]

    const lowerMessage = message.toLowerCase()
    return (
      keywords.some((keyword) => lowerMessage.includes(keyword)) &&
      (lowerMessage.includes("generate") || lowerMessage.includes("create"))
    )
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Check if this is a story generation request
      const isStoryRequest = detectStoryGenerationRequest(currentInput)

      if (isStoryRequest) {
        // Try to generate stories from the conversation context
        const response = await fetch("/api/generate-stories-from-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
            conversationHistory: messages,
          }),
        })

        if (response.ok) {
          const data = await response.json()

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
            stories: data.stories,
            isStoryGeneration: true,
          }

          setMessages((prev) => [...prev, assistantMessage])
        } else {
          throw new Error("Failed to generate stories")
        }
      } else {
        // Regular chat response
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
            history: messages,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get response")
        }

        const data = await response.json()

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendToStoryManager = (stories: any[]) => {
    if (onStoriesGenerated) {
      onStoriesGenerated(stories)
      toast({
        title: "Stories sent to Story Manager",
        description: `${stories.length} stories have been added to the Stories tab.`,
      })
    }
  }

  const handlePublishToJira = async (stories: any[], messageId: string) => {
    setPublishingStories(messageId)
    try {
      const response = await fetch("/api/publish-to-jira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stories: stories,
          projectKey: selectedProject,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to publish stories")
      }

      const data = await response.json()

      toast({
        title: "Stories published to Jira!",
        description: data.message || `${data.publishedCount} stories have been published to your Jira backlog.`,
      })

      // Add a success message to the chat
      const successMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `✅ Successfully published ${data.publishedCount} out of ${data.totalStories} stories to your Jira backlog! You can view them in your Jira project.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } catch (error) {
      console.error("Publish error:", error)
      toast({
        title: "Error publishing to Jira",
        description: error instanceof Error ? error.message : "Failed to publish stories. Please try again.",
        variant: "destructive",
      })

      // Add an error message to the chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `❌ There was an issue publishing some stories to Jira. This might be due to field configuration in your Jira project. You can try using the "Send to Story Manager" option to review and publish stories individually.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setPublishingStories(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const StoryCard = ({ story }: { story: any }) => (
    <div className="bg-white border rounded-lg p-3 mb-2">
      <div className="flex items-center space-x-2 mb-2">
        <Badge variant={story.type === "epic" ? "default" : "secondary"}>{story.type.toUpperCase()}</Badge>
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
          {story.priority}
        </Badge>
        {story.storyPoints && <Badge variant="outline">{story.storyPoints} pts</Badge>}
      </div>
      <h4 className="font-medium text-sm mb-1">{story.title}</h4>
      <p className="text-xs text-gray-600 mb-2">{story.description}</p>
      {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">Acceptance Criteria:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {story.acceptanceCriteria.slice(0, 2).map((criteria: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{criteria}</span>
              </li>
            ))}
            {story.acceptanceCriteria.length > 2 && (
              <li className="text-gray-500">... and {story.acceptanceCriteria.length - 2} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <ProjectSelector selectedProject={selectedProject} onProjectSelect={setSelectedProject} />

      <Card className="h-[500px] flex flex-col bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            <span>AI Assistant</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Ask questions, paste BRD content, or request user story generation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">
          <div className="flex-1 min-h-0 bg-gray-50 rounded-lg p-3">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      } p-3 rounded-lg`}
                    >
                      <p className="text-sm whitespace-pre-wrap mb-2">{message.content}</p>

                      {/* Display generated stories */}
                      {message.stories && message.stories.length > 0 && (
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center space-x-2 mb-3">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">
                              Generated {message.stories.length} Stories
                            </span>
                          </div>

                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {message.stories.map((story, index) => (
                              <StoryCard key={index} story={story} />
                            ))}
                          </div>

                          <div className="flex flex-col space-y-2 pt-3 border-t border-gray-200">
                            <Button
                              size="sm"
                              onClick={() => handleSendToStoryManager(message.stories!)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Send to Story Manager
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePublishToJira(message.stories!, message.id)}
                              disabled={publishingStories === message.id || !selectedProject}
                              className="w-full"
                            >
                              {publishingStories === message.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Publish Directly to Jira
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <p className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="bg-gray-100 p-2 rounded-full flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">
                          {detectStoryGenerationRequest(input) ? "Generating stories..." : "Thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex space-x-2 pt-2 border-t border-gray-200 bg-white">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paste your BRD content or ask me to generate user stories..."
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="flex-shrink-0" size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
