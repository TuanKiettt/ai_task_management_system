import { emailTemplates, EmailTemplateType } from './email-templates'

interface EmailConfig {
  to: string
  subject: string
  html: string
  text: string
}

class EmailService {
  private static instance: EmailService
  private isConfigured: boolean = false

  private constructor() {
    // Check if email service is configured
    this.isConfigured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    )
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  private async sendEmail(email: EmailConfig): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        console.log('Email service not configured. Email would be sent:', {
          to: email.to,
          subject: email.subject,
          html: email.html.substring(0, 100) + '...'
        })
        return true // Return true for development
      }

      // In production, implement actual email sending logic
      // Example with nodemailer:
      /*
      const nodemailer = require('nodemailer')
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT!),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@aitaskextraction.com',
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })
      */

      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendPasswordReset(email: string, resetUrl: string, userName: string): Promise<boolean> {
    const template = emailTemplates.passwordReset(resetUrl, userName)
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  async sendTaskAssignment(email: string, taskTitle: string, assignedBy: string, taskUrl: string): Promise<boolean> {
    const template = emailTemplates.taskAssigned(taskTitle, assignedBy, taskUrl)
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  async sendTaskDueReminder(email: string, taskTitle: string, dueDate: string, taskUrl: string): Promise<boolean> {
    const template = emailTemplates.taskDueReminder(taskTitle, dueDate, taskUrl)
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  async sendWelcomeEmail(email: string, userName: string, loginUrl: string): Promise<boolean> {
    const template = emailTemplates.welcome(userName, loginUrl)
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  async sendOverdueTasksWarning(email: string, taskCount: number, dashboardUrl: string): Promise<boolean> {
    const template = emailTemplates.overdueTasksWarning(taskCount, dashboardUrl)
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  // Generic method for any template type
  async sendTemplate<T extends EmailTemplateType>(
    templateType: T,
    email: string,
    ...args: any[]
  ): Promise<boolean> {
    const template = (emailTemplates[templateType] as any)(...args)
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  isEmailConfigured(): boolean {
    return this.isConfigured
  }

  getConfigurationStatus(): {
    configured: boolean
    missing: string[]
  } {
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
    const missing = required.filter(key => !process.env[key])
    
    return {
      configured: missing.length === 0,
      missing
    }
  }
}

export const emailService = EmailService.getInstance()
