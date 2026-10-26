import { generateReminders } from '../lib/reminders.js';
generateReminders().then(result=>{console.log('Reminder generation complete:',JSON.stringify(result));process.exit(0)}).catch(error=>{console.error(error);process.exit(1)});
