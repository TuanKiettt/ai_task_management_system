# AI Task Extraction App

A comprehensive full-stack application that combines AI-powered task extraction with productivity management features. Built with Next.js, TypeScript, and modern web technologies.

## Features

### Core Functionality
- **AI-Powered Chat Interface**: Multiple AI modes including assistant, task generation, smart scheduling, and productivity coaching
- **Task Management**: Create, organize, and track tasks with AI assistance
- **Real-time Collaboration**: WebSocket-based real-time updates
- **Authentication & Security**: NextAuth.js integration with 2FA support
- **Database Integration**: PostgreSQL with Prisma ORM

### AI Modes
- **Chat Assistant**: General help and Q&A
- **Task Generator**: Extract tasks from natural language
- **Smart Schedule**: AI-powered scheduling assistance
- **Productivity Coach**: Productivity tips and optimization

### Additional Features
- **Dashboard**: Comprehensive overview of tasks and activities
- **Analytics**: Track productivity metrics and insights
- **Projects & Workspaces**: Organize tasks by project
- **Calendar Integration**: Event management and scheduling
- **File Attachments**: Support for task-related files
- **Notifications**: Real-time notification system
- **Theme Support**: Dark/light mode toggle

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component library
- **Lucide React**: Icon library
- **Recharts**: Data visualization

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma**: Database ORM
- **PostgreSQL**: Primary database
- **NextAuth.js**: Authentication
- **WebSocket**: Real-time communication

### AI Integration
- **Local AI Service**: On-premise AI processing
- **Python Scripts**: AI model training and processing

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Python 3.8+ (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TuanKiettt/ai_task_management_system.git
   cd ai_task_management_system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.template .env
   ```
   Configure your database URL, authentication secrets, and AI service settings.

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Install Python dependencies for AI features**
   ```bash
   pip install -r python/requirements.txt
   ```

### Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## AI Model Setup

**Important**: AI models are excluded from the repository to keep it lightweight. You need to download them manually for AI functionality to work.

### Download Models from Google Drive

1. **Download the model file**: https://drive.google.com/file/d/1PEaMPJQ0gei4PqXdPwHUmuckBNSQdtnm/view?usp=sharing

2. **Extract the ZIP file** to get the model folders

3. **Copy the extracted folders** to:
   ```
   python/models/

   ```

### Start AI Server

After downloading models, start the AI server:
```bash
python python/ai_server.py
```

The AI server will start on `http://localhost:8000` by default.

**Note**: Without the models, the application will still run but AI features will not work properly.

### Database Management

- **View database**: `npm run db:studio`
- **Generate Prisma client**: `npm run db:generate`
- **Push schema changes**: `npm run db:push`

### AI Training

Train the AI model with custom data:
```bash
npm run ai-train
```

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   └── ...
├── components/         # React components
│   ├── ui/            # Base UI components
│   └── ...
├── context/           # React context providers
├── lib/               # Utility functions
├── prisma/            # Database schema and migrations
├── public/            # Static assets
├── python/            # AI processing scripts
└── styles/            # Global styles
```

## Key Components

### Context Providers
- `UserProvider`: User authentication and profile management
- `ChatProvider`: Chat state and AI interactions
- `TaskProvider`: Task management and CRUD operations
- `NotificationProvider`: Real-time notifications
- `ThemeProvider`: UI theme management

### Core Components
- `FloatingChat`: AI chat interface with multiple modes
- `SidebarNav`: Main navigation component
- `RouteGuard`: Authentication and route protection
- `AppWrapper`: Application layout wrapper

## API Endpoints

### Authentication
- `/api/auth/*` - NextAuth.js authentication endpoints

### Tasks
- `/api/tasks` - Task CRUD operations
- `/api/tasks/extract` - AI-powered task extraction

### Chat
- `/api/chat` - AI chat interactions
- `/api/chat/modes` - Available AI modes

### Real-time
- WebSocket endpoints for real-time updates

## Environment Variables

Key environment variables to configure:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
AI_SERVICE_ENDPOINT=...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
