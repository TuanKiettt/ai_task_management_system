import { generateText, Output } from "ai"
import { z } from "zod"

// Schema for extracted tasks
const taskSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe("Clear, actionable task title"),
      description: z.string().nullable().describe("Optional additional details"),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).describe("Task priority based on urgency/importance"),
      category: z.string().describe("Task category like Academic, Meeting, Administrative, Planning, etc."),
      estimatedTime: z.string().describe("Estimated time to complete, e.g. '30m', '1h', '2h'"),
      dueDate: z.string().nullable().describe("Due date in YYYY-MM-DD format if mentioned, otherwise null"),
    })
  ),
})

// Few-shot examples to "train" the model on expected behavior
const fewShotExamples = `
Example 1:
User: "I need to prepare slides for Monday's meeting and also review the Q3 report by Friday"
Output:
{
  "tasks": [
    {
      "title": "Prepare slides for Monday meeting",
      "description": "Create presentation slides for the upcoming Monday meeting",
      "priority": "High",
      "category": "Meeting",
      "estimatedTime": "2h",
      "dueDate": null
    },
    {
      "title": "Review Q3 report",
      "description": "Review and analyze the Q3 quarterly report",
      "priority": "Medium",
      "category": "Administrative",
      "estimatedTime": "1h",
      "dueDate": null
    }
  ]
}

Example 2:
User: "Tomorrow I have a doctor appointment at 2pm, then I need to pick up groceries and call mom"
Output:
{
  "tasks": [
    {
      "title": "Doctor appointment",
      "description": "Medical appointment scheduled for 2pm",
      "priority": "High",
      "category": "Health",
      "estimatedTime": "1h",
      "dueDate": null
    },
    {
      "title": "Pick up groceries",
      "description": null,
      "priority": "Medium",
      "category": "Personal",
      "estimatedTime": "45m",
      "dueDate": null
    },
    {
      "title": "Call mom",
      "description": null,
      "priority": "Low",
      "category": "Personal",
      "estimatedTime": "30m",
      "dueDate": null
    }
  ]
}

Example 3:
User: "URGENT: Server is down! Need to fix the production bug ASAP and then write incident report"
Output:
{
  "tasks": [
    {
      "title": "Fix production server bug",
      "description": "Critical: Server is currently down, needs immediate attention",
      "priority": "Urgent",
      "category": "Technical",
      "estimatedTime": "2h",
      "dueDate": null
    },
    {
      "title": "Write incident report",
      "description": "Document the server outage incident and resolution",
      "priority": "High",
      "category": "Administrative",
      "estimatedTime": "30m",
      "dueDate": null
    }
  ]
}

Example 4:
User: "This week I want to finish reading chapter 5, complete the math homework due Wednesday, and start the science project"
Output:
{
  "tasks": [
    {
      "title": "Read chapter 5",
      "description": "Complete reading assignment for chapter 5",
      "priority": "Medium",
      "category": "Academic",
      "estimatedTime": "1h",
      "dueDate": null
    },
    {
      "title": "Complete math homework",
      "description": "Math assignment due Wednesday",
      "priority": "High",
      "category": "Academic",
      "estimatedTime": "1h",
      "dueDate": null
    },
    {
      "title": "Start science project",
      "description": "Begin working on the science project",
      "priority": "Medium",
      "category": "Academic",
      "estimatedTime": "2h",
      "dueDate": null
    }
  ]
}

Example 5:
User: "Schedule team standup for every morning, set up 1:1 with Sarah next Tuesday, and don't forget to submit expense reports by end of month"
Output:
{
  "tasks": [
    {
      "title": "Schedule daily team standup",
      "description": "Set up recurring morning standup meeting for the team",
      "priority": "Medium",
      "category": "Meeting",
      "estimatedTime": "15m",
      "dueDate": null
    },
    {
      "title": "Schedule 1:1 with Sarah",
      "description": "Set up one-on-one meeting with Sarah for next Tuesday",
      "priority": "Medium",
      "category": "Meeting",
      "estimatedTime": "30m",
      "dueDate": null
    },
    {
      "title": "Submit expense reports",
      "description": "Complete and submit expense reports before end of month deadline",
      "priority": "High",
      "category": "Administrative",
      "estimatedTime": "45m",
      "dueDate": null
    }
  ]
}
`

const systemPrompt = `You are an intelligent task extraction assistant. Your job is to analyze user input and extract actionable tasks.

Guidelines:
1. Extract ALL distinct tasks mentioned in the input
2. Create clear, actionable task titles (start with a verb when possible)
3. Assign appropriate priorities:
   - Urgent: Critical, time-sensitive, blocking issues
   - High: Important deadlines, significant impact
   - Medium: Regular tasks, moderate importance
   - Low: Nice-to-have, flexible timing
4. Categorize tasks appropriately (Academic, Meeting, Administrative, Planning, Personal, Technical, Health, Creative, etc.)
5. Estimate realistic completion times
6. Extract due dates if explicitly mentioned (format: YYYY-MM-DD)
7. If input is unclear or not task-related, still try to identify any actionable items
8. Combine related sub-tasks into single tasks when appropriate
9. Keep descriptions concise but informative

${fewShotExamples}

Now extract tasks from the user's input:`

export async function POST(req: Request) {
  try {
    const { input, userId = "anonymous" } = await req.json()

    if (!input || typeof input !== "string") {
      return Response.json({ error: "Invalid input" }, { status: 400 })
    }

    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({
        schema: taskSchema,
      }),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: input,
        },
      ],
    })

    // Automatically collect training example asynchronously
    if (output?.tasks && output.tasks.length > 0) {
      collectTrainingExample(input, output.tasks, userId).catch((err) => {
        console.error("[v0] Failed to store training example:", err)
      })
    }

    return Response.json({ tasks: output?.tasks || [] })
  } catch (error) {
    console.error("Task extraction error:", error)
    return Response.json(
      { error: "Failed to extract tasks", tasks: [] },
      { status: 500 }
    )
  }
}

// Collect training examples for model fine-tuning
async function collectTrainingExample(
  userInput: string,
  extractedTasks: any[],
  userId: string
) {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      console.warn("[v0] DATABASE_URL not set, skipping training data collection")
      return
    }

    const { Client } = await import("pg")
    const client = new Client({ connectionString: dbUrl }) as any
    await client.connect()

    const output = JSON.stringify({ tasks: extractedTasks })
    const status = "pending" // Will be reviewed and approved by admin

    await client.query(
      `INSERT INTO training_examples (user_input, model_output, status, created_by)
       VALUES ($1, $2, $3, $4)`,
      [userInput, output, status, userId]
    )

    await client.end()
    console.log("[v0] Training example collected successfully")
  } catch (error) {
    console.error("[v0] Training collection error:", error)
    // Silently fail - don't break the main API
  }
}
