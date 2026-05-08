import { NextRequest, NextResponse } from 'next/server'

// Mock database for projects
let projects: any[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const industry = searchParams.get('industry')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Filter projects by user ID and industry
    let userProjects = projects.filter(p => p.userId === userId)
    
    // If no projects in DB, return fallback data based on industry
    if (userProjects.length === 0) {
      const fallbackProjects = industry === "corporate" ? [
        {
          id: "1",
          userId,
          name: "Digital Transformation Initiative",
          status: "In Progress",
          progress: 65,
          team: 8,
          deadline: "May 30, 2025",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { 
          id: "2", 
          userId,
          name: "Market Expansion Q2", 
          status: "Planning", 
          progress: 25, 
          team: 5, 
          deadline: "Jun 15, 2025",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { 
          id: "3", 
          userId,
          name: "Product Launch Campaign", 
          status: "In Progress", 
          progress: 80, 
          team: 12, 
          deadline: "May 20, 2025",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ] : [
        { 
          id: "4", 
          userId,
          name: "Brand Identity Redesign", 
          status: "In Progress", 
          progress: 70, 
          team: 4, 
          deadline: "May 25, 2025",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { 
          id: "5", 
          userId,
          name: "Social Media Campaign", 
          status: "Review", 
          progress: 90, 
          team: 3, 
          deadline: "May 15, 2025",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { 
          id: "6", 
          userId,
          name: "Website Mockups", 
          status: "In Progress", 
          progress: 45, 
          team: 2, 
          deadline: "Jun 1, 2025",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      return NextResponse.json(fallbackProjects)
    }
    
    return NextResponse.json(userProjects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const project = await request.json()
    
    // Validate required fields
    if (!project.name || !project.deadline || !project.userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create new project
    const newProject = {
      id: Date.now().toString(),
      ...project,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to mock database
    projects.push(newProject)
    
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
