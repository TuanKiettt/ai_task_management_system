# Scripts Directory

## 📋 Scripts Overview

### 🔧 Production Maintenance Scripts
- `cleanup-overdue-tasks.js` - Clean up overdue tasks (requires CLEANUP_API_KEY)
- `generate-task-reminders.js` - Generate intelligent task reminders (requires CLEANUP_API_KEY)
- `maintenance.js` - Run comprehensive maintenance (requires CLEANUP_API_KEY)

### 🛠️ Utility Scripts
- `cleanup-credentials.js` - Clean hardcoded credentials from codebase

### 📚 Documentation
- `browser-test-guide.md` - Guide for testing AI task extraction in browser

## 🔐 Security Notice

⚠️ **IMPORTANT**: Most scripts require environment variables to be set:

```bash
# Required for most scripts
CLEANUP_API_KEY=your-secure-api-key-here
API_URL=http://localhost:3000
```

## 📝 Usage Examples

```bash
# Run maintenance (production)
node scripts/maintenance.js

# Clean up overdue tasks
node scripts/cleanup-overdue-tasks.js

# Generate task reminders
node scripts/generate-task-reminders.js

# Clean credentials from codebase
node scripts/cleanup-credentials.js
```

## 🗂️ Files Safe for Git

- ✅ All files in this directory are production-ready
- ✅ No hardcoded credentials
- ✅ All use environment variables

## 🎯 Production Setup

1. Set environment variables:
   ```bash
   CLEANUP_API_KEY=your-secure-api-key-here
   API_URL=http://localhost:3000
   ```

2. Schedule maintenance (cron job):
   ```bash
   # Run every 2 hours
   0 */2 * * * cd /path/to/project && node scripts/maintenance.js
   ```

## 📚 Additional Documentation

- See `browser-test-guide.md` for testing AI features
- See `PRODUCTION_README.md` for full deployment guide
