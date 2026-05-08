interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export const emailTemplates = {
  // Password Reset Email
  passwordReset: (resetUrl: string, userName: string): EmailTemplate => ({
    subject: "Reset Your Password - AI Task Extraction",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password for your AI Task Extraction account.</p>
            
            <div class="security-notice">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <p>To reset your password, click the button below:</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The AI Task Extraction Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Task Extraction. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset - AI Task Extraction
      
      Hi ${userName},
      
      We received a request to reset your password for your AI Task Extraction account.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      To reset your password, visit this link:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you have any questions, please contact our support team.
      
      Best regards,
      The AI Task Extraction Team
    `
  }),

  // Task Assignment Notification
  taskAssigned: (taskTitle: string, assignedBy: string, taskUrl: string): EmailTemplate => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Assigned</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .task-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4facfe; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Task Assigned</h1>
          </div>
          <div class="content">
            <p>You have been assigned a new task!</p>
            
            <div class="task-info">
              <h3>${taskTitle}</h3>
              <p><strong>Assigned by:</strong> ${assignedBy}</p>
            </div>
            
            <center>
              <a href="${taskUrl}" class="button">View Task</a>
            </center>
            
            <p>Best regards,<br>The AI Task Extraction Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Task Extraction. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Task Assigned
      
      You have been assigned a new task!
      
      Task: ${taskTitle}
      Assigned by: ${assignedBy}
      
      View the task here: ${taskUrl}
      
      Best regards,
      The AI Task Extraction Team
    `
  }),

  // Task Due Date Reminder
  taskDueReminder: (taskTitle: string, dueDate: string, taskUrl: string): EmailTemplate => ({
    subject: `Task Due Soon: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Due Soon</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #fa709a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .due-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Task Due Soon</h1>
          </div>
          <div class="content">
            <p>This is a friendly reminder that you have a task due soon.</p>
            
            <div class="due-info">
              <h3>${taskTitle}</h3>
              <p><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            
            <center>
              <a href="${taskUrl}" class="button">View Task</a>
            </center>
            
            <p>Best regards,<br>The AI Task Extraction Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Task Extraction. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Task Due Soon
      
      This is a friendly reminder that you have a task due soon.
      
      Task: ${taskTitle}
      Due Date: ${dueDate}
      
      View the task here: ${taskUrl}
      
      Best regards,
      The AI Task Extraction Team
    `
  }),

  // Welcome Email
  welcome: (userName: string, loginUrl: string): EmailTemplate => ({
    subject: "Welcome to AI Task Extraction!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AI Task Extraction</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to AI Task Extraction!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Welcome to AI Task Extraction! We're excited to help you manage your tasks more efficiently with our AI-powered system.</p>
            
            <div class="feature">
              <h3>🤖 AI-Powered Task Extraction</h3>
              <p>Simply describe your tasks in natural language and our AI will extract and organize them for you.</p>
            </div>
            
            <div class="feature">
              <h3>👥 Workspace Collaboration</h3>
              <p>Work together with your team, assign tasks, and track progress in real-time.</p>
            </div>
            
            <div class="feature">
              <h3>📊 Smart Analytics</h3>
              <p>Get insights into your productivity and task completion patterns.</p>
            </div>
            
            <center>
              <a href="${loginUrl}" class="button">Get Started</a>
            </center>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>The AI Task Extraction Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Task Extraction. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to AI Task Extraction!
      
      Hi ${userName},
      
      Welcome to AI Task Extraction! We're excited to help you manage your tasks more efficiently with our AI-powered system.
      
      Key Features:
      • AI-Powered Task Extraction - Describe tasks in natural language
      • Workspace Collaboration - Work together with your team
      • Smart Analytics - Get productivity insights
      
      Get started here: ${loginUrl}
      
      If you have any questions, feel free to reach out to our support team.
      
      Best regards,
      The AI Task Extraction Team
    `
  }),

  // Overdue Tasks Warning
  overdueTasksWarning: (taskCount: number, dashboardUrl: string): EmailTemplate => ({
    subject: `⚠️ Action Required: ${taskCount} Tasks Pending Deletion`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Overdue Tasks Warning</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #ffe0e0; border: 1px solid #ff6b6b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Action Required</h1>
          </div>
          <div class="content">
            <p>You have <strong>${taskCount}</strong> task(s) that are overdue and pending deletion.</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> These tasks will be automatically deleted soon if no action is taken. Please review and update them to prevent data loss.
            </div>
            
            <center>
              <a href="${dashboardUrl}" class="button">Review Tasks Now</a>
            </center>
            
            <p>Best regards,<br>The AI Task Extraction Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Task Extraction. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Action Required: Tasks Pending Deletion
      
      You have ${taskCount} task(s) that are overdue and pending deletion.
      
      ⚠️ Important: These tasks will be automatically deleted soon if no action is taken. Please review and update them to prevent data loss.
      
      Review your tasks here: ${dashboardUrl}
      
      Best regards,
      The AI Task Extraction Team
    `
  })
}

export type EmailTemplateType = keyof typeof emailTemplates
