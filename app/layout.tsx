import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SidebarNav } from "@/components/sidebar-nav"
import { UserProvider } from "@/context/user-context"
import { RouteGuard } from "@/components/route-guard"
import { ChatProvider } from "@/context/chat-context"
import { TaskProvider } from "@/context/task-context"
import { NotificationProvider } from "@/context/notification-context"
import { ThemeProvider } from "@/context/theme-context"
import { TimetableProvider } from "@/context/timetable-context"
import { LearningProvider } from "@/context/learning-context"
import { EventProvider } from "@/context/events-context"
import { AssignmentsProvider } from "@/context/assignments-context"
import { RecordsProvider } from "@/context/records-context"
import { ProjectsProvider } from "@/context/projects-context"
import { WorkspaceProvider } from "@/context/workspace-context"
import { CommentProvider } from "@/context/comment-context"
import { AttachmentProvider } from "@/context/attachment-context"
import { ReactionProvider } from "@/context/reaction-context"
import { SubtaskProvider } from "@/context/subtask-context"
import { ToastProvider } from "@/components/toast-provider"
import { AppWrapper } from "@/components/app-wrapper"

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Alba - AI Task Manager",
  description: "Multi-industry AI-powered task management assistant",
  icons: {
    icon: [],
    apple: [],
    shortcut: [],
  },
  other: {
    'msapplication-TileImage': '',
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#13171f" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <AppWrapper>
          <ThemeProvider>
            <UserProvider>
              <TaskProvider>
                <TimetableProvider>
                  <LearningProvider>
                    <EventProvider>
                      <AssignmentsProvider>
                        <RecordsProvider>
                          <ProjectsProvider>
                            <WorkspaceProvider>
                              <CommentProvider>
                                <AttachmentProvider>
                                  <ReactionProvider>
                                    <SubtaskProvider>
                                      <ToastProvider>
                                        <NotificationProvider>
                                          <ChatProvider>
                                            <RouteGuard>
                                              <SidebarNav />
                                              <div className="sm:pl-16 lg:pl-64 min-h-screen pb-16 sm:pb-0 transition-all duration-300 bg-background">
                                                {children}
                                              </div>
                                            </RouteGuard>
                                          </ChatProvider>
                                        </NotificationProvider>
                                      </ToastProvider>
                                    </SubtaskProvider>
                                  </ReactionProvider>
                                </AttachmentProvider>
                              </CommentProvider>
                            </WorkspaceProvider>
                          </ProjectsProvider>
                        </RecordsProvider>
                      </AssignmentsProvider>
                    </EventProvider>
                  </LearningProvider>
                </TimetableProvider>
              </TaskProvider>
            </UserProvider>
          </ThemeProvider>
        </AppWrapper>
        <Analytics />
      </body>
    </html>
  )
}
