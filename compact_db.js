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
    
    // Force compaction to remove deleted records
    dropGameLogs.persistence.compactDatafile((err) => {
        if (err) {
            console.error('Error compacting database:', err);
            return;
        }
        
        console.log('Database compacted successfully');
        
        // Verify remaining records
        dropGameLogs.find({}).exec((err, docs) => {
            if (err) {
                console.error('Error finding remaining records:', err);
                return;
            }
            
            console.log(`Database now contains ${docs.length} records:`);
            docs.forEach(doc => {
                console.log(`- ID ${doc._id}: ${doc.totalQuestions} questions, score: ${doc.score}%`);
            });
        });
    });
});
