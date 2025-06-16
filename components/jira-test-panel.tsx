"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, User, FolderOpen, Settings, AlertTriangle, AlertCircle } from "lucide-react"

interface JiraTestPanelProps {
  jiraContext: any | null;
  isInJira: boolean;
}

export function JiraTestPanel({ jiraContext, isInJira }: JiraTestPanelProps) {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testJiraConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-jira")
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        error: "Network error",
        details: "Failed to connect to the test endpoint",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Jira Connection Test</span>
        </CardTitle>
        <CardDescription>Test your Jira API connection and view available configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testJiraConnection} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            "Test Jira Connection"
          )}
        </Button>

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                {testResult.success ? "Connection Successful" : "Connection Failed"}
              </span>
            </div>

            {testResult.success ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Connected User</span>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>Name:</strong> {testResult.user.displayName}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Email:</strong> {testResult.user.emailAddress}
                  </p>
                </div>

                {/* Projects */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Available Projects ({testResult.projects.length})</span>
                  </div>
                  <div className="space-y-1">
                    {testResult.projects.slice(0, 3).map((project: any) => (
                      <div key={project.id} className="text-sm text-blue-700">
                        <strong>{project.key}:</strong> {project.name}
                      </div>
                    ))}
                    {testResult.projects.length > 3 && (
                      <p className="text-sm text-blue-600">... and {testResult.projects.length - 3} more</p>
                    )}
                  </div>
                </div>

                {/* Issue Types */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Settings className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">Issue Types Analysis</span>
                  </div>

                  {/* Project-specific issue types */}
                  {testResult.issueTypes.projectSpecific.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-purple-700 mb-1">✅ Project Issue Types (Recommended):</p>
                      <div className="flex flex-wrap gap-1">
                        {testResult.issueTypes.projectSpecific.map((type: any) => (
                          <Badge key={type.id} variant="default" className="text-xs bg-green-100 text-green-800">
                            {type.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Global regular issue types */}
                  {testResult.issueTypes.globalRegular.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-purple-700 mb-1">📋 Global Regular Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {testResult.issueTypes.globalRegular.map((type: any) => (
                          <Badge key={type.id} variant="outline" className="text-xs">
                            {type.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtask types (problematic) */}
                  {testResult.issueTypes.subtasks.length > 0 && (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <div className="flex items-center space-x-1 mb-1">
                        <AlertCircle className="h-3 w-3 text-yellow-600" />
                        <p className="text-xs font-medium text-yellow-800">⚠️ Sub-task Types (Excluded):</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {testResult.issueTypes.subtasks.map((type: any) => (
                          <Badge key={type.id} variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                            {type.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        These require parent issues and are automatically excluded.
                      </p>
                    </div>
                  )}
                </div>

                {/* Priorities */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Priorities</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {testResult.priorities.map((priority: any) => (
                      <Badge key={priority.id} variant="outline" className="text-xs">
                        {priority.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {testResult.error}
                </p>
                {testResult.details && (
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Details:</strong> {JSON.stringify(testResult.details, null, 2)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
