export async function registerUser(email: string, password: string, fullName: string, industry: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName, industry }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Registration failed")
  }

  return response.json()
}

export async function loginUser(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Login failed")
  }

  return response.json()
}

export async function fetchTasks(userId: string) {
  const response = await fetch(`/api/tasks?userId=${userId}`)
  if (!response.ok) throw new Error("Failed to fetch tasks")
  return response.json()
}

export async function createTask(taskData: {
  userId: string
  title: string
  description?: string
  category: string
  priority: string
  status: string
  estimatedTime: string
  dueDate?: string
}) {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  })

  if (!response.ok) throw new Error("Failed to create task")
  return response.json()
}

export async function updateTask(taskId: string, updates: any) {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })

  if (!response.ok) throw new Error("Failed to update task")
  return response.json()
}

export async function deleteTask(taskId: string) {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
  })

  if (!response.ok) throw new Error("Failed to delete task")
  return response.json()
}

export async function fetchConversations(userId: string) {
  const response = await fetch(`/api/conversations?userId=${userId}`)
  if (!response.ok) throw new Error("Failed to fetch conversations")
  return response.json()
}

export async function createConversation(userId: string, title: string) {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title }),
  })

  if (!response.ok) throw new Error("Failed to create conversation")
  return response.json()
}

export async function createMessage(conversationId: string, role: string, content: string) {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, role, content }),
  })

  if (!response.ok) throw new Error("Failed to create message")
  return response.json()
}

export async function fetchMessages(conversationId: string) {
  const response = await fetch(`/api/messages?conversationId=${conversationId}`)
  if (!response.ok) throw new Error("Failed to fetch messages")
  return response.json()
}
