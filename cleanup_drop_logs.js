import Datastore from '@seald-io/nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the drop game logs database
const dropGameLogs = new Datastore({
    filename: path.join(__dirname, "db", "drop_game_logs.db"),
    timestampData: true,
});

dropGameLogs.loadDatabase((err) => {
    if (err) {
        console.error('Error loading database:', err);
        return;
    }

    console.log('Database loaded successfully');

    // Find all logs and group by user and session (based on timestamps)
    dropGameLogs.find({}).sort({ userId: 1, date: 1 }).exec((err, allLogs) => {
        if (err) {
            console.error('Error finding logs:', err);
            return;
        }

        console.log('Found', allLogs.length, 'total logs');

        // Group logs by user and session time window (within 2 minutes = same session)
        const sessions = [];
        let currentSession = null;

        allLogs.forEach(log => {
            const logTime = new Date(log.date);
            
            if (!currentSession || 
                currentSession.userId !== log.userId || 
                (logTime - currentSession.lastTime) > 120000) { // 2 minutes = 120000ms
                
                // Start new session
                currentSession = {
                    userId: log.userId,
                    username: log.username,
                    logs: [log],
                    lastTime: logTime
                };
                sessions.push(currentSession);
            } else {
                // Add to current session
                currentSession.logs.push(log);
                currentSession.lastTime = logTime;
            }
        });

        console.log('Grouped into', sessions.length, 'sessions');

        // For each session with multiple logs, keep only the one with highest totalQuestions
        let toRemove = [];
        sessions.forEach(session => {
            if (session.logs.length > 1) {
                console.log(`Session for ${session.username}: ${session.logs.length} logs`);
                
                // Sort by totalQuestions descending, then by date descending
                session.logs.sort((a, b) => {
                    if (b.totalQuestions !== a.totalQuestions) {
                        return b.totalQuestions - a.totalQuestions;
                    }
                    return new Date(b.date) - new Date(a.date);
                });

                // Keep the first (best) log, mark others for removal
                const toKeep = session.logs[0];
                const toRemoveFromSession = session.logs.slice(1);
                
                console.log(`  Keeping: ID ${toKeep._id} (${toKeep.totalQuestions} questions)`);
                toRemoveFromSession.forEach(log => {
                    console.log(`  Removing: ID ${log._id} (${log.totalQuestions} questions)`);
                });

                toRemove = toRemove.concat(toRemoveFromSession);
            }
        });

        if (toRemove.length === 0) {
            console.log('No duplicate sessions found. Database is clean.');
            return;
        }

        console.log(`\nRemoving ${toRemove.length} duplicate entries...`);

        // Remove the duplicate entries
        let removed = 0;
        toRemove.forEach((log, index) => {
            dropGameLogs.remove({ _id: log._id }, {}, (err, numRemoved) => {
                if (err) {
                    console.error(`Error removing log ${log._id}:`, err);
                } else if (numRemoved > 0) {
                    removed++;
                    console.log(`Removed log ID ${log._id}`);
                }

                // When all removals are done
                if (index === toRemove.length - 1) {
                    console.log(`\nCleanup complete. Removed ${removed} duplicate entries.`);
                }
            });
        });
    });
});
