// Date extraction utilities for automatic calendar scheduling
export interface ExtractedDate {
  date: Date
  confidence: number
  originalText: string
}

export interface ExtractedTaskWithDate {
  title: string
  category: string
  priority: "Low" | "Medium" | "High" | "Urgent"
  estimatedTime: string
  date?: Date
  confidence: number
}

export class DateTimeExtractor {
  private readonly monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ]

  private readonly relativeDatePatterns = [
    { pattern: /\b(today)\b/i, getRelativeDate: (_match: RegExpMatchArray) => new Date() },
    { pattern: /\b(tomorrow)\b/i, getRelativeDate: (_match: RegExpMatchArray) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }},
    { pattern: /\b(next day)\b/i, getRelativeDate: (_match: RegExpMatchArray) => {
      const nextDay = new Date()
      nextDay.setDate(nextDay.getDate() + 1)
      return nextDay
    }},
    { pattern: /\b(next week)\b/i, getRelativeDate: (_match: RegExpMatchArray) => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
    }},
    { pattern: /\b(next month)\b/i, getRelativeDate: (_match: RegExpMatchArray) => {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    }},
    // Day of week patterns
    { pattern: /\b(next monday)\b/i, getRelativeDate: (_match: RegExpMatchArray) => this.getNextDayOfWeek(1) },
    { pattern: /\b(next tuesday)\b/i, getRelativeDate: (_match: RegExpMatchArray) => this.getNextDayOfWeek(2) },
    { pattern: /\b(next wednesday)\b/i, getRelativeDate: (_match: RegExpMatchArray) => this.getNextDayOfWeek(3) },
    { pattern: /\b(next thursday)\b/i, getRelativeDate: (_match: RegExpMatchArray) => this.getNextDayOfWeek(4) },
    { pattern: /\b(next friday)\b/i, getRelativeDate: (_match: RegExpMatchArray) => this.getNextDayOfWeek(5) },
    { pattern: /\b(next saturday)\b/i, getRelativeDate: (_match: RegExpMatchArray) => this.getNextDayOfWeek(6) },
    { pattern: /\b(next sunday)\b/i, getRelativeDate: (_match: RegExpMatchArray) => this.getNextDayOfWeek(0) },
    // Extended patterns for edge cases
    { pattern: /\bin (\d+) days?\b/i, getRelativeDate: (match: RegExpMatchArray) => {
      const days = parseInt(match[1])
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date
    }},
    { pattern: /\bthis (morning|afternoon|evening)\b/i, getRelativeDate: (match: RegExpMatchArray) => {
      const date = new Date()
      const timeOfDay = match[1].toLowerCase()
      if (timeOfDay === 'morning') date.setHours(9, 0, 0, 0)
      else if (timeOfDay === 'afternoon') date.setHours(14, 0, 0, 0)
      else if (timeOfDay === 'evening') date.setHours(18, 0, 0, 0)
      return date
    }},
    { pattern: /\bby (\w+) EOD\b/i, getRelativeDate: (match: RegExpMatchArray) => {
      const dayName = match[1].toLowerCase()
      const dayMap: { [key: string]: number } = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0 }
      const date = this.getNextDayOfWeek(dayMap[dayName] || 5)
      date.setHours(17, 0, 0, 0) // 5 PM EOD
      return date
    }},
    { pattern: /\bend of next week\b/i, getRelativeDate: () => {
      const date = new Date()
      date.setDate(date.getDate() + 7) // Next week
      date.setDate(date.getDate() + (6 - date.getDay())) // Friday
      return date
    }}
  ]

  private getNextDayOfWeek(dayOfWeek: number): Date {
    const today = new Date()
    const currentDay = today.getDay()
    let daysUntilNext = dayOfWeek - currentDay
    
    if (daysUntilNext <= 0) {
      daysUntilNext += 7 // Go to next week if today is the same day or past it
    }
    
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysUntilNext)
    return nextDate
  }

  extractDates(text: string): ExtractedDate[] {
    const dates: ExtractedDate[] = []
    const currentYear = new Date().getFullYear()

    // Check for relative dates
    for (const { pattern, getRelativeDate } of this.relativeDatePatterns) {
      const match = text.match(pattern)
      if (match) {
        const date = getRelativeDate(match)
        dates.push({
          date,
          confidence: 0.9,
          originalText: match[1] || match[0]
        })
      }
    }

    // Check for "DD/MM" or "DD/MM/YYYY" format
    const datePattern = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/g
    let match

    while ((match = datePattern.exec(text)) !== null) {
      const [, day, month, year] = match
      const date = new Date()
      
      date.setDate(parseInt(day))
      date.setMonth(parseInt(month) - 1) // JavaScript months are 0-indexed
      
      if (year) {
        date.setFullYear(parseInt(year.length === 2 ? '20' + year : year))
      } else {
        // If no year specified, use current year or next year if date has passed
        const dateWithCurrentYear = new Date(date)
        dateWithCurrentYear.setFullYear(currentYear)
        
        if (dateWithCurrentYear < new Date()) {
          date.setFullYear(currentYear + 1)
        } else {
          date.setFullYear(currentYear)
        }
      }

      dates.push({
        date,
        confidence: 0.8,
        originalText: match[0]
      })
    }

    // Check for month name patterns
    for (let i = 0; i < this.monthNames.length; i++) {
      const monthName = this.monthNames[i]
      const monthPattern = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthName}(?:\\s+(\\d{4}))?\\b`, 'i')
      const monthMatch = text.match(monthPattern)
      
      if (monthMatch) {
        const [, day, year] = monthMatch
        const date = new Date()
        
        date.setDate(parseInt(day))
        date.setMonth(i) // JavaScript months are 0-indexed
        
        if (year) {
          date.setFullYear(parseInt(year))
        } else {
          // Use current year or next year if date has passed
          const dateWithCurrentYear = new Date(date)
          dateWithCurrentYear.setFullYear(currentYear)
          
          if (dateWithCurrentYear < new Date()) {
            date.setFullYear(currentYear + 1)
          } else {
            date.setFullYear(currentYear)
          }
        }

        dates.push({
          date,
          confidence: 0.85,
          originalText: monthMatch[0]
        })
      }
    }

    // Check for "March 28" pattern (reversed)
    for (let i = 0; i < this.monthNames.length; i++) {
      const monthName = this.monthNames[i]
      const monthPattern = new RegExp(`\\b${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`, 'i')
      const monthMatch = text.match(monthPattern)
      
      if (monthMatch) {
        const [, day, year] = monthMatch
        const date = new Date()
        
        date.setDate(parseInt(day))
        date.setMonth(i) // JavaScript months are 0-indexed
        
        if (year) {
          date.setFullYear(parseInt(year))
        } else {
          // Use current year or next year if date has passed
          const dateWithCurrentYear = new Date(date)
          dateWithCurrentYear.setFullYear(currentYear)
          
          if (dateWithCurrentYear < new Date()) {
            date.setFullYear(currentYear + 1)
          } else {
            date.setFullYear(currentYear)
          }
        }

        dates.push({
          date,
          confidence: 0.85,
          originalText: monthMatch[0]
        })
      }
    }

    return dates.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * ML fallback for edge cases when no rules match
   * This would call an external ML service or use a trained model
   */
  private async extractDatesWithML(text: string): Promise<ExtractedDate[]> {
    // Placeholder for ML-based date extraction
    // In production, this could call:
    // - OpenAI API with date parsing prompts
    // - Custom trained NER model
    // - Third-party date parsing service
    
    try {
      // Example: Call external ML service
      // const response = await fetch('/api/ai/extract-dates', {
      //   method: 'POST',
      //   body: JSON.stringify({ text })
      // })
      // const mlResult = await response.json()
      
      // For now, return empty array
      // In production, implement actual ML integration
      return []
    } catch (error) {
      console.warn('ML date extraction failed:', error)
      return []
    }
  }

  /**
   * Enhanced extraction with ML fallback
   */
  async extractDatesWithFallback(text: string): Promise<ExtractedDate[]> {
    // Try rule-based first (fast, accurate)
    const ruleBasedDates = this.extractDates(text)
    
    if (ruleBasedDates.length > 0) {
      return ruleBasedDates
    }
    
    // Fallback to ML for edge cases
    const mlDates = await this.extractDatesWithML(text)
    
    // Return ML results with lower confidence
    return mlDates.map(date => ({
      ...date,
      confidence: date.confidence * 0.8 // Lower confidence for ML results
    }))
  }

  extractTasksWithDates(text: string): ExtractedTaskWithDate[] {
    const tasks: ExtractedTaskWithDate[] = []
    const dates = this.extractDates(text)
    const primaryDate = dates.length > 0 ? dates[0] : undefined

    // Extract task patterns
    const taskPatterns = [
      // "I have to [task] on [date]"
      /\b(I have to|I need to|I must|I should|I've got to|gotta)\s+([^,.!?]+?)(?:\s+on\s+|\s+by\s+|\s+before\s+)([^,.!?]+)/gi,
      // "Present about [topic] on [date]"
      /\b(present|presenting|presentation|talk|speak|speaking)\s+(?:about|on|regarding)\s+([^,.!?]+?)(?:\s+on\s+|\s+by\s+|\s+before\s+)([^,.!?]+)/gi,
      // "Meeting on [date] about [topic]"
      /\b(meeting|call|appointment|session)\s+(?:on\s+)?([^,.!?]+?)(?:\s+about\s+|\s+for\s+|\s+regarding\s+)([^,.!?]+)/gi,
      // Simple task with date
      /\b([^,.!?]+?)\s+(?:on|by|before)\s+([^,.!?]+)/gi,
      // NEW: Direct task patterns without explicit triggers
      /\b(present|presenting|presentation|talk|speak|speaking)\s+(?:about|on|regarding)?\s*([^,.!?]+)/gi,
      /\b(meeting|call|appointment|session)\s+(?:about|for|regarding)?\s*([^,.!?]+)/gi,
      /\b(review|submit|finish|complete|prepare|plan|organize)\s+([^,.!?]+)/gi,
      // NEW: Task + date pattern (date first)
      /\b(today|tomorrow|next day|next week|next month|next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday)\s*,?\s*([^,.!?]+)/gi
    ]

    for (const pattern of taskPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        let taskTitle = ''
        let dateText = ''

        if (match.length === 4) {
          // Pattern with explicit task and date parts
          taskTitle = match[2].trim()
          dateText = match[3].trim()
        } else if (match.length === 3) {
          // Simple pattern or date-first pattern
          taskTitle = match[2].trim()
          dateText = match[1].trim()
          
          // Check if this is a date-first pattern
          const isDateFirst = /\b(today|tomorrow|next day|next week|next month|next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday)\b/i.test(dateText)
          if (isDateFirst) {
            // Swap them back - taskTitle is actually the task, dateText is the date
            const temp = taskTitle
            taskTitle = dateText
            dateText = temp
          }
        } else if (match.length === 2) {
          // Direct task pattern
          taskTitle = match[1].trim()
          dateText = '' // No explicit date, will use primaryDate
        }

        if (taskTitle.length > 3) {
          // Clean up task title
          taskTitle = taskTitle.replace(/^(I have to|I need to|I must|I should|I've got to|gotta)\s+/i, '')
          taskTitle = taskTitle.replace(/\s+(on|by|before)\s+.*$/i, '')

          // Extract date from the date text or use primary date
          let taskDate = primaryDate?.date
          if (dateText) {
            const extractedDates = this.extractDates(dateText)
            if (extractedDates.length > 0) {
              taskDate = extractedDates[0].date
            }
          }

          // Determine priority based on content
          const priority = this.determinePriority(taskTitle, taskDate)

          // Determine category
          const category = this.determineCategory(taskTitle)

          // Estimate time
          const estimatedTime = this.estimateTime(taskTitle)

          tasks.push({
            title: taskTitle,
            category,
            priority,
            estimatedTime,
            date: taskDate,
            confidence: taskDate ? 0.9 : 0.7
          })
        }
      }
    }

    // If no structured patterns found, try to extract simple task with any date found
    if (tasks.length === 0 && primaryDate) {
      const simpleTaskPattern = /\b([^,.!?]{10,})\b/i
      const match = text.match(simpleTaskPattern)
      
      if (match) {
        const taskTitle = match[1].trim()
        if (taskTitle.length > 5 && !taskTitle.toLowerCase().includes('present about')) {
          tasks.push({
            title: taskTitle,
            category: this.determineCategory(taskTitle),
            priority: this.determinePriority(taskTitle, primaryDate.date),
            estimatedTime: this.estimateTime(taskTitle),
            date: primaryDate.date,
            confidence: 0.6
          })
        }
      }
    }

    return tasks
  }

  private determinePriority(taskTitle: string, date?: Date): "Low" | "Medium" | "High" | "Urgent" {
    const lowerTitle = taskTitle.toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check for urgency keywords
    if (/\b(urgent|asap|immediately|emergency|critical)\b/.test(lowerTitle)) {
      return "Urgent"
    }

    // Check for high priority keywords
    if (/\b(present|presentation|exam|test|deadline|important|meeting|call)\b/.test(lowerTitle)) {
      return "High"
    }

    // Check date proximity
    if (date) {
      const taskDate = new Date(date)
      taskDate.setHours(0, 0, 0, 0)
      const daysUntil = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntil <= 1) return "Urgent"
      if (daysUntil <= 3) return "High"
      if (daysUntil <= 7) return "Medium"
    }

    // Check for medium priority indicators
    if (/\b(review|prepare|plan|organize|research|study)\b/.test(lowerTitle)) {
      return "Medium"
    }

    return "Low"
  }

  private determineCategory(taskTitle: string): string {
    const lowerTitle = taskTitle.toLowerCase()

    if (/\b(present|presentation|talk|speak|meeting|call)\b/.test(lowerTitle)) {
      return "Work"
    }
    if (/\b(study|exam|test|course|learn)\b/.test(lowerTitle)) {
      return "Academic"
    }
    if (/\b(project|develop|code|design|create)\b/.test(lowerTitle)) {
      return "Project"
    }
    if (/\b(research|analyze|investigate)\b/.test(lowerTitle)) {
      return "Research"
    }
    if (/\b(review|check|edit|proofread)\b/.test(lowerTitle)) {
      return "Review"
    }
    if (/\b(plan|organize|schedule)\b/.test(lowerTitle)) {
      return "Planning"
    }

    return "Personal"
  }

  private estimateTime(taskTitle: string): string {
    const lowerTitle = taskTitle.toLowerCase()

    if (/\b(present|presentation|talk)\b/.test(lowerTitle)) {
      return "2h"
    }
    if (/\b(meeting|call)\b/.test(lowerTitle)) {
      return "30m"
    }
    if (/\b(review|check)\b/.test(lowerTitle)) {
      return "15m"
    }
    if (/\b(research|study|learn)\b/.test(lowerTitle)) {
      return "1h"
    }
    if (/\b(plan|organize)\b/.test(lowerTitle)) {
      return "45m"
    }
    if (/\b(project|develop|create|design)\b/.test(lowerTitle)) {
      return "3h"
    }

    return "30m"
  }
}

export const dateTimeExtractor = new DateTimeExtractor()
