"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Plus, AlertCircle, CheckCircle } from "lucide-react"
import { useUser } from "@/context/user-context"

interface AITaskExtractorProps {
  userMessage: string
  onTasksExtracted: (tasks: Array<{ title: string; category: string; priority: string; time: string; date?: Date }>) => void
  isLoading?: boolean
  workspaceId?: string  // Add optional workspaceId
}

export function AITaskExtractor({ userMessage, onTasksExtracted, isLoading: externalLoading, workspaceId }: AITaskExtractorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showTasks, setShowTasks] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const { industry } = useUser()

  const handleExtractTasks = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🧠 Extracting tasks with True AI (Custom-Trained Models)...');

      // Use persistent custom-trained AI models
      const response = await fetch('/api/ai/persistent-true-ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ 
          message: userMessage,
          userId: 'current-user',
          context: { 
            timestamp: new Date().toISOString(),
            workspaceId: workspaceId || null
          }
        })
      });

      if (!response.ok) {
        throw new Error(`True AI API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ True AI Response:', data);

      if (data.success && data.task) {
        const aiTask = {
          id: `ai-${Date.now()}`,
          title: data.task.title,
          category: data.task.category,
          priority: data.task.priority,
          time: data.task.time,
          date: data.task.date,
          completed: false,
          createdAt: new Date(),
          confidence: data.confidence,
          source: data.task.source,
          motivationalNote: data.task.motivationalNote,
          hasDate: data.task.hasDate
        };

        console.log('🎯 True AI Task:', aiTask);

        if (onTasksExtracted) {
          onTasksExtracted([aiTask]);
        }

        // Show success message with model info
        if (data.model_info?.type) {
          setError(`✅ ${data.task.motivationalNote} (${data.model_info.type})`);
        } else {
          setError(`✅ ${data.task.motivationalNote}`);
        }

      } else {
        throw new Error(data.error || 'True AI extraction failed');
      }

    } catch (error) {
      console.error('❌ True AI extraction failed:', error);
      
      // Fallback to rule-based if custom model fails
      try {
        console.log('🔄 Falling back to rule-based extraction...');
        
        const fallbackResponse = await fetch('/api/ai/multiwoz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage })
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.task) {
            const fallbackTask = {
              id: `fallback-${Date.now()}`,
              title: fallbackData.task.title,
              category: fallbackData.task.category,
              priority: fallbackData.task.priority,
              time: 'No time specified',
              completed: false,
              createdAt: new Date(),
              confidence: 0.5,
              source: 'Rule-based Fallback',
              motivationalNote: 'Task created using rule-based fallback (custom model unavailable)',
              hasDate: !!fallbackData.task.dueDate
            };

            if (onTasksExtracted) {
              onTasksExtracted([fallbackTask]);
            }

            setError('⚠️ Using rule-based fallback - custom AI model temporarily unavailable');
            return;
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      // Final fallback
      const fallbackTask = {
        title: userMessage,
        category: 'general',
        priority: 'medium',
        time: 'No time specified',
        confidence: 0.5,
        hasDate: false,
        motivationalNote: 'Task created from message (fallback)',
        industryContext: industry || undefined,
        source: 'Error Fallback'
      };
      
      setExtractedTasks([fallbackTask]);
      setShowTasks(true);
      setSelectedTasks(new Set([0]));
      setError('❌ Failed to extract task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onTasksExtracted]);

  // Helper function to parse date strings
  const parseDate = (dateStr: string): Date | undefined => {
    try {
      // Handle common date formats
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length >= 2) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1]) - 1 // JS months are 0-indexed
          const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear()
          return new Date(year, month, day)
        }
      }
      
      // Handle relative dates
      const today = new Date()
      const lower = dateStr.toLowerCase()
      
      if (lower.includes('today')) return today
      if (lower.includes('tomorrow')) {
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow
      }
      
      // Handle "28/3" format
      const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/)
      if (match) {
        const day = parseInt(match[1])
        const month = parseInt(match[2]) - 1
        const year = match[3] ? parseInt(match[3]) : today.getFullYear()
        return new Date(year, month, day)
      }
      
      return undefined
    } catch {
      return undefined
    }
  }

  const toggleTaskSelection = (index: number) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTasks(newSelected)
  }

  const handleAddSelectedTasks = () => {
    const tasksToAdd = extractedTasks
      .filter((_, i) => selectedTasks.has(i))
      .map((task) => ({
        title: task.title,
        category: task.category,
        priority: task.priority,
        time: task.estimatedTime,
        date: task.date,
      }))

    if (tasksToAdd.length > 0) {
      onTasksExtracted(tasksToAdd)
      setShowTasks(false)
      setExtractedTasks([])
      setSelectedTasks(new Set())
    }
  }

  return (
    <div className="space-y-3">
      {/* Extract Button */}
      {!showTasks && extractedTasks.length === 0 && (
        <Button
          onClick={() => handleExtractTasks(userMessage)}
          disabled={isLoading || externalLoading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium transition-all"
        >
          {isLoading || externalLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Extract Tasks with AI
            </>
          )}
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50">
          <CardContent className="p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-600 dark:text-red-200 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Extracted Tasks Display */}
      {showTasks && extractedTasks.length > 0 && (
        <Card className="bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#2d3548]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {extractedTasks.length} Tasks Found
              </h3>
              <span className="text-xs text-violet-600 bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded-full font-medium">
                {selectedTasks.size} selected
              </span>
            </div>
            
            {/* Dataset Attribution */}
            <p className="text-[10px] text-gray-400 mb-2">
              Basic task extraction with date parsing {industry && `• Optimized for ${industry}`}
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {extractedTasks.map((task, index) => (
                <div
                  key={index}
                  onClick={() => toggleTaskSelection(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedTasks.has(index)
                      ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-600/50"
                      : "bg-gray-50 dark:bg-[#252b3b] border-gray-200 dark:border-[#2d3548] hover:border-violet-300 dark:hover:border-violet-600/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        selectedTasks.has(index)
                          ? "bg-violet-600 border-violet-600"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {selectedTasks.has(index) && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium text-sm">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs bg-gray-100 dark:bg-[#2d3548] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                          {task.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            task.priority === "Urgent"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                              : task.priority === "High"
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                : task.priority === "Medium"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.hasDate && task.date && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                            📅 {task.date.toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{task.estimatedTime}</span>
                      </div>
                      
                      {task.motivationalNote && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">{task.motivationalNote}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#2d3548]">
              <Button
                onClick={() => {
                  setShowTasks(false)
                  setExtractedTasks([])
                  setError(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSelectedTasks}
                disabled={selectedTasks.size === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add {selectedTasks.size} Task{selectedTasks.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
