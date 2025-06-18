"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Bot, User, Loader2, FileText, ArrowRight, CheckCircle, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProjectSelector } from "@/components/project-selector"
import clsx from "clsx"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
  jiraContext: any | null
  isInJira: boolean
}

export function ChatInterface({ onStoriesGenerated, jiraContext, isInJira }: ChatInterfaceProps) {
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
  const [selectedStories, setSelectedStories] = useState<{ [messageId: string]: number[] }>({})
  const [editingStory, setEditingStory] = useState<{ messageId: string; index: number } | null>(null)
  const [editedStory, setEditedStory] = useState<any>(null)

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
      const isStoryRequest = detectStoryGenerationRequest(currentInput)

      if (isStoryRequest) {
        // 1. Use RAG to find related content
        const ragResponse = await fetch("/api/rag-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
          }),
        })

        if (!ragResponse.ok) {
          throw new Error("Failed to generate stories")
        }

        const ragData = await ragResponse.json()
        let ragStories = parseStoriesFromResponse(ragData.response)
        let relatedContext = null
        if (ragStories.length && (ragStories[0] as any)?.similarity_score !== undefined) {
          ragStories = (ragStories as any[]).filter((s) => s.similarity_score > 0.4)
            .sort((a, b) => b.similarity_score - a.similarity_score)
          if (ragStories.length > 0) {
            // Use the top related RAG content as context
            relatedContext = ragStories.map((s) => `${s.title}\n${s.description}\n${(s.acceptanceCriteria || []).join("\n")}`).join("\n\n")
          }
        }

        let finalStories: any[] = []
        if (relatedContext) {
          // 2. If RAG context found, pass to Gemini LLM for story generation
          const llmWithContextResponse = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: currentInput,
              ragContext: relatedContext,
              history: messages,
            }),
          })
          if (llmWithContextResponse.ok) {
            const llmData = await llmWithContextResponse.json()
            finalStories = parseStoriesFromResponse(llmData.response)
          }
        } else {
          // 3. If no RAG context, generate stories directly from Gemini LLM
          const llmResponse = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: currentInput,
              history: messages,
            }),
          })
          if (llmResponse.ok) {
            const llmData = await llmResponse.json()
            finalStories = parseStoriesFromResponse(llmData.response)
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: relatedContext ? `Generated using RAG context.\n\n${finalStories.map(s => s.title).join("\n")}` : `Generated using LLM.\n\n${finalStories.map(s => s.title).join("\n")}`,
          timestamp: new Date(),
          stories: finalStories,
          isStoryGeneration: true,
        }

        setMessages((prev) => [...prev, assistantMessage])
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
      console.error("Error in chat:", error)
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

  // Helper function to parse stories from RAG response
  const parseStoriesFromResponse = (response: string) => {
    interface Story {
      title: string;
      description: string;
      type: 'epic' | 'story';
      priority: 'High' | 'Medium' | 'Low';
      acceptanceCriteria: string[];
    }

    const stories: Story[] = []
    const lines = response.split('\n')
    let currentStory: Story | null = null

    for (const line of lines) {
      if (line.includes('Title:') || line.includes('**Title**')) {
        if (currentStory) {
          // Ensure type is set and valid
          if (!currentStory.type || (currentStory.type !== 'epic' && currentStory.type !== 'story')) {
            currentStory.type = 'story';
          }
          stories.push(currentStory)
        }
        currentStory = {
          title: line.split(':')[1]?.trim() || line.replace('**Title**', '').trim(),
          description: '',
          type: 'story', // Default to story
          priority: 'Medium', // Default to Medium
          acceptanceCriteria: []
        }
      } else if (currentStory) {
        if (line.includes('Description:') || line.includes('**Description**')) {
          currentStory.description = line.split(':')[1]?.trim() || line.replace('**Description**', '').trim()
        } else if (line.includes('Priority:') || line.includes('**Priority**')) {
          const priority = line.split(':')[1]?.trim() || line.replace('**Priority**', '').trim()
          if (priority.toLowerCase().includes('high')) currentStory.priority = 'High'
          else if (priority.toLowerCase().includes('low')) currentStory.priority = 'Low'
        } else if (line.includes('Type:') || line.includes('**Type**')) {
          const type = line.split(':')[1]?.trim().toLowerCase() || line.replace('**Type**', '').trim().toLowerCase();
          if (type.includes('epic')) currentStory.type = 'epic';
          else if (type.includes('story')) currentStory.type = 'story';
        } else if (line.includes('Acceptance Criteria:') || line.includes('**Acceptance Criteria**')) {
          // Start collecting acceptance criteria
          currentStory.acceptanceCriteria = []
        } else if (currentStory.acceptanceCriteria && line.trim().startsWith('-')) {
          currentStory.acceptanceCriteria.push(line.trim().substring(1).trim())
        }
      }
    }

    if (currentStory) {
      // Ensure type is set and valid
      if (!currentStory.type || (currentStory.type !== 'epic' && currentStory.type !== 'story')) {
        currentStory.type = 'story';
      }
      stories.push(currentStory)
    }

    // Already returns a flat array of stories (epics and stories)
    return stories
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
    const selected = selectedStories[messageId]
      ? stories.filter((_, idx) => selectedStories[messageId].includes(idx))
      : stories;
    if (!selected.length) return;
    // Ensure type is always 'epic' or 'story'
    const cleaned = selected.map((s) => ({
      ...s,
      type: s.type?.toLowerCase() === 'epic' ? 'epic' : 'story',
    }));
    setPublishingStories(messageId)
    try {
      const response = await fetch("/api/publish-to-jira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stories: cleaned,
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

  // Handle checkbox toggle (multi-select)
  const handleStorySelect = (messageId: string, index: number) => {
    setSelectedStories((prev) => {
      const prevSelected = prev[messageId] || [];
      let newSelected;
      if (prevSelected.includes(index)) {
        newSelected = prevSelected.filter(i => i !== index);
      } else {
        newSelected = [...prevSelected, index];
      }
      return { ...prev, [messageId]: newSelected };
    });
  };

  // Handle edit button
  const handleEditStory = (messageId: string, index: number, story: any) => {
    setEditingStory({ messageId, index });
    setEditedStory({ ...story });
  };

  // Handle save after editing
  const handleSaveEdit = (messageId: string, index: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.stories) {
          const newStories = [...msg.stories];
          newStories[index] = { ...editedStory };
          return { ...msg, stories: newStories };
        }
        return msg;
      })
    );
    setEditingStory(null);
    setEditedStory(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingStory(null);
    setEditedStory(null);
  };

  const StoryCard = ({ story, index, messageId }: { story: any; index: number; messageId: string }) => {
    const isEditing = editingStory && editingStory.messageId === messageId && editingStory.index === index;
    return (
      <Card className={`${selectedStories[messageId]?.includes(index) ? "ring-2 ring-blue-500" : ""} mb-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                className="mt-1 mr-2 accent-blue-600"
                checked={selectedStories[messageId]?.includes(index) || false}
                onChange={() => handleStorySelect(messageId, index)}
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant={story.type === "epic" ? "default" : "secondary"}>{story.type?.toUpperCase() || "STORY"}</Badge>
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
                <CardTitle className="text-base font-bold">{story.title || "Untitled Story"}</CardTitle>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={() => handleEditStory(messageId, index, story)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isEditing ? (
            <div className="space-y-2">
              <Label>Title</Label>
              <input
                className="w-full border rounded p-1 text-sm"
                value={editedStory.title}
                onChange={(e) => setEditedStory({ ...editedStory, title: e.target.value })}
              />
              <Label>Description</Label>
              <textarea
                className="w-full border rounded p-1 text-sm"
                value={editedStory.description}
                onChange={(e) => setEditedStory({ ...editedStory, description: e.target.value })}
              />
              <Label>Acceptance Criteria</Label>
              <textarea
                className="w-full border rounded p-1 text-sm"
                value={editedStory.acceptanceCriteria?.join("\n")}
                onChange={(e) => setEditedStory({ ...editedStory, acceptanceCriteria: e.target.value.split("\n") })}
                placeholder="Acceptance Criteria (one per line)"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleSaveEdit(messageId, index)} className="bg-green-600 text-white">Save</Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">{story.description || "No description provided"}</p>
              {story.acceptanceCriteria && Array.isArray(story.acceptanceCriteria) && story.acceptanceCriteria.length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-gray-600">Acceptance Criteria</Label>
                  <ul className="mt-1 space-y-1">
                    {story.acceptanceCriteria.map((criteria: string, idx: number) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start">
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
    );
  };

  // Group stories by epic title for UI grouping
  const groupStoriesByEpic = (stories: any[]) => {
    const epics: any[] = [];
    const epicMap: { [title: string]: any } = {};
    const storyGroups: { [epicTitle: string]: any[] } = {};
    for (const s of stories) {
      if (s.type === 'epic') {
        epics.push(s);
        epicMap[s.title] = s;
        storyGroups[s.title] = [];
      }
    }
    for (const s of stories) {
      if (s.type === 'story') {
        // Try to match to an epic by title in description or acceptance criteria
        let foundEpic = epics.find(e =>
          s.description?.toLowerCase().includes(e.title.toLowerCase()) ||
          (s.acceptanceCriteria || []).some((c: string) => c.toLowerCase().includes(e.title.toLowerCase()))
        );
        if (!foundEpic && epics.length === 1) foundEpic = epics[0]; // fallback: only one epic
        if (foundEpic) {
          storyGroups[foundEpic.title].push(s);
        } else {
          // Orphan story, not matched to any epic
          if (!storyGroups['__orphan__']) storyGroups['__orphan__'] = [];
          storyGroups['__orphan__'].push(s);
        }
      }
    }
    return { epics, storyGroups };
  };

  return (
    <div className="space-y-4">
      <ProjectSelector selectedProject={selectedProject} onProjectSelect={setSelectedProject} />

      <Card className="h-[700px] w-full max-w-5xl mx-auto flex flex-col bg-white">
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
          <div className="flex-1 min-h-0 bg-gray-50 rounded-lg p-3 w-full max-w-4xl mx-auto">
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
                        (() => {
                          const { epics, storyGroups } = groupStoriesByEpic(message.stories ?? []);
                          const selectedCount = selectedStories[message.id]?.length || 0;
                          return (
                            <div className="space-y-6">
                              {epics.map((epic, epicIdx) => (
                                <div key={epicIdx} className="">
                                  <StoryCard story={epic} index={message.stories?.indexOf(epic) ?? 0} messageId={message.id} />
                                  {storyGroups[epic.title] && storyGroups[epic.title].length > 0 && (
                                    <div className="pl-8 border-l-2 border-blue-200 mt-2 space-y-2">
                                      {storyGroups[epic.title].map((story: any, idx: number) => (
                                        <StoryCard key={idx} story={story} index={message.stories?.indexOf(story) ?? 0} messageId={message.id} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {/* Render orphan stories if any */}
                              {storyGroups['__orphan__'] && storyGroups['__orphan__'].length > 0 && (
                                <div className="mt-4">
                                  <div className="text-xs text-gray-500 mb-1">Other Stories</div>
                                  {storyGroups['__orphan__'].map((story: any, idx: number) => (
                                    <StoryCard key={idx} story={story} index={message.stories?.indexOf(story) ?? 0} messageId={message.id} />
                                  ))}
                                </div>
                              )}
                              {/* Publish to Jira button for selected responses */}
                              <div className="pt-4 flex justify-end">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handlePublishToJira(message.stories!, message.id)}
                                  disabled={publishingStories === message.id || !selectedProject || !selectedCount}
                                  className={clsx(
                                    "w-auto px-6",
                                    publishingStories === message.id
                                      ? "bg-blue-300 cursor-not-allowed"
                                      : selectedCount
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  )}
                                >
                                  {publishingStories === message.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Publishing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Publish to Jira ({selectedCount})
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })()
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
