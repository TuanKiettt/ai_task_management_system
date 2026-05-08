/**
 * Environment variables required:
 * CLEANUP_API_KEY=your-secure-api-key-here
 * API_URL=http://localhost:3000
 */

#!/usr/bin/env node

/**
 * Comprehensive maintenance script for the task management system
 * Runs both overdue task cleanup and intelligent reminder generation
 * 
 * Usage:
 * node scripts/maintenance.js
 * 
 * Cron setup (run every 2 hours):
 * 0 \*/2 * * * cd /path/to/project && node scripts/maintenance.js
 */

const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:3000';
// API_KEY should be set via environment variablelocalhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLEANUP_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ ${description}:`, result);
          resolve(result);
        } catch (error) {
          console.error(`❌ Error parsing ${description} response:`, error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${description} request failed:`, error);
      reject(error);
    });

    req.write(JSON.stringify({}));
    req.end();
  });
}

async function runMaintenance() {
  console.log('🔧 Starting comprehensive maintenance...');
  console.log('='.repeat(50));
  
  const startTime = new Date();
  
  try {
    // Step 1: Clean up overdue tasks
    console.log('🧹 Step 1: Cleaning up overdue tasks...');
    const cleanupResult = await makeRequest('/api/cleanup/overdue-tasks', 'Overdue Task Cleanup');
    
    // Step 2: Generate intelligent reminders
    console.log('\n🔔 Step 2: Generating intelligent reminders...');
    const reminderResult = await makeRequest('/api/notifications/generate-task-reminders', 'Task Reminder Generation');
    
    // Summary
    const endTime = new Date();
    const duration = endTime - startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 MAINTENANCE SUMMARY');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🗑️  Tasks Deleted: ${cleanupResult.deletedCount || 0}`);
    console.log(`🔔 Reminders Created: ${reminderResult.notificationsCreated || 0}`);
    console.log(`👥 Users Processed: ${reminderResult.usersProcessed || 0}`);
    
    if (cleanupResult.deletedCount > 0) {
      console.log(`✨ System cleanup: Removed ${cleanupResult.deletedCount} overdue tasks`);
    }
    
    if (reminderResult.notificationsCreated > 0) {
      console.log(`🎯 User engagement: Generated ${reminderResult.notificationsCreated} personalized reminders`);
    }
    
    if (cleanupResult.deletedCount === 0 && reminderResult.notificationsCreated === 0) {
      console.log('📋 No maintenance actions needed - system is in good shape!');
    }
    
    console.log('\n🚀 Maintenance completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Maintenance failed:', error);
    process.exit(1);
  }
}

// Run maintenance
runMaintenance();
