import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST() {
  try {
    // First, let's create a sample user if not exists
    const user = await prisma.user.findFirst({
      where: { email: "test@example.com" }
    })

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email: "test@example.com",
          password: "hashedpassword",
          fullName: "Test User",
          industry: "corporate"
        }
      })
      console.log("Created test user:", newUser.id)
    }

    // Get the user
    const testUser = await prisma.user.findFirst({
      where: { email: "test@example.com" }
    })

    if (!testUser) {
      return NextResponse.json({ error: "Failed to create test user" }, { status: 500 })
    }

    // Create a sample workspace if not exists
    let workspace = await prisma.workspace.findFirst({
      where: { name: "Sample Workspace" }
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Sample Workspace",
          description: "A workspace for testing",
          ownerId: testUser.id
        }
      })
      console.log("Created sample workspace:", workspace.id)
    }

    // Create sample tasks
    const sampleTasks = [
      {
        title: "Design new landing page",
        description: "Create mockups and wireframes for the new landing page design",
        category: "Design",
        priority: "High" as const,
        status: "new" as const,
        estimatedTime: "8h",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        workspaceId: workspace.id,
        userId: testUser.id
      },
      {
        title: "Implement user authentication",
        description: "Add login and registration functionality with JWT tokens",
        category: "Development",
        priority: "Urgent" as const,
        status: "processing" as const,
        estimatedTime: "12h",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        workspaceId: workspace.id,
        userId: testUser.id
      },
      {
        title: "Write API documentation",
        description: "Document all API endpoints with examples and error codes",
        category: "Documentation",
        priority: "Medium" as const,
        status: "new" as const,
        estimatedTime: "4h",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        workspaceId: workspace.id,
        userId: testUser.id
      },
      {
        title: "Setup CI/CD pipeline",
        description: "Configure GitHub Actions for automated testing and deployment",
        category: "DevOps",
        priority: "High" as const,
        status: "done" as const,
        estimatedTime: "6h",
        workspaceId: workspace.id,
        userId: testUser.id
      },
      {
        title: "Fix responsive design issues",
        description: "Address mobile layout problems on smaller screens",
        category: "Bug Fix",
        priority: "Urgent" as const,
        status: "urgent" as const,
        estimatedTime: "2h",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        workspaceId: workspace.id,
        userId: testUser.id
      }
    ]

    const createdTasks = []
    for (const taskData of sampleTasks) {
      const task = await prisma.task.create({
        data: taskData
      })
      createdTasks.push(task)
    }

    // Create some subtasks for the first task
    const firstTask = createdTasks[0]
    const subtasks = [
      { title: "Research competitors", completed: true },
      { title: "Create wireframes", completed: true },
      { title: "Design high-fidelity mockups", completed: false },
      { title: "Get stakeholder approval", completed: false }
    ]

    for (const subtask of subtasks) {
      await prisma.subtask.create({
        data: {
          parentTaskId: firstTask.id,
          title: subtask.title,
          completed: subtask.completed
        }
      })
    }

    // Create some comments
    await prisma.comment.createMany({
      data: [
        {
          taskId: createdTasks[1].id,
          userId: testUser.id,
          content: "Started working on the authentication system. Using JWT for tokens."
        },
        {
          taskId: createdTasks[0].id,
          userId: testUser.id,
          content: "Initial wireframes are ready for review."
        }
      ]
    })

    return NextResponse.json({
      message: "Sample data created successfully",
      userId: testUser.id,
      workspaceId: workspace.id,
      tasks: createdTasks.length
    })

  } catch (error) {
    console.error("Seed data error:", error)
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    )
  }
}
