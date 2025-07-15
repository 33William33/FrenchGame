#!/usr/bin/env node
import Datastore from "@seald-io/nedb";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize databases
const users = new Datastore({
    filename: path.join(__dirname, "db", "users.db"),
    timestampData: true,
});

const images = new Datastore({
    filename: path.join(__dirname, "db", "images.db"),
    timestampData: true,
});

const logs = new Datastore({
    filename: path.join(__dirname, "db", "logs.db"),
    timestampData: true,
});

const serverConfig = new Datastore({
    filename: path.join(__dirname, "db", "config.db"),
    timestampData: true,
});

// Load databases
users.loadDatabase();
images.loadDatabase();
logs.loadDatabase();
serverConfig.loadDatabase();

console.log("=== NeDB Database Viewer ===\n");

// Function to display users (without passwords)
function showUsers() {
    return new Promise((resolve) => {
        users.find({}, (err, data) => {
            if (err) {
                console.error("Error reading users:", err);
                resolve();
                return;
            }
            
            console.log("📊 USERS TABLE:");
            console.log("=" * 50);
            if (data.length === 0) {
                console.log("No users found.\n");
            } else {
                data.forEach(user => {
                    console.log(`ID: ${user._id}`);
                    console.log(`Username: ${user.username}`);
                    console.log(`Created: ${new Date(user.createdAt).toLocaleString()}`);
                    console.log(`Updated: ${new Date(user.updatedAt).toLocaleString()}`);
                    console.log("-".repeat(30));
                });
            }
            console.log();
            resolve();
        });
    });
}

// Function to display images
function showImages() {
    return new Promise((resolve) => {
        images.find({}, (err, data) => {
            if (err) {
                console.error("Error reading images:", err);
                resolve();
                return;
            }
            
            console.log("🖼️  IMAGES TABLE:");
            console.log("=" * 50);
            if (data.length === 0) {
                console.log("No images found.\n");
            } else {
                data.forEach(img => {
                    console.log(`ID: ${img._id}`);
                    console.log(`Name: ${img.imageName}`);
                    console.log(`Author: ${img.author}`);
                    console.log(`Owner ID: ${img.owner_id}`);
                    console.log(`URL: ${img.url}`);
                    console.log(`Date: ${new Date(img.date).toLocaleString()}`);
                    console.log("-".repeat(30));
                });
            }
            console.log();
            resolve();
        });
    });
}

// Function to display logs
function showLogs() {
    return new Promise((resolve) => {
        logs.find({}, (err, data) => {
            if (err) {
                console.error("Error reading logs:", err);
                resolve();
                return;
            }
            
            console.log("📝 LOGS TABLE:");
            console.log("=" * 50);
            if (data.length === 0) {
                console.log("No logs found.\n");
            } else {
                data.forEach(log => {
                    console.log(`ID: ${log._id}`);
                    console.log(`Created: ${new Date(log.createdAt).toLocaleString()}`);
                    console.log(`Data: ${JSON.stringify(log, null, 2)}`);
                    console.log("-".repeat(30));
                });
            }
            console.log();
            resolve();
        });
    });
}

// Function to display server config
function showConfig() {
    return new Promise((resolve) => {
        serverConfig.find({}, (err, data) => {
            if (err) {
                console.error("Error reading config:", err);
                resolve();
                return;
            }
            
            console.log("⚙️  SERVER CONFIG:");
            console.log("=" * 50);
            if (data.length === 0) {
                console.log("No config found.\n");
            } else {
                data.forEach(cfg => {
                    console.log(`ID: ${cfg._id}`);
                    console.log(`Next: ${cfg.next}`);
                    console.log(`Created: ${new Date(cfg.createdAt).toLocaleString()}`);
                    console.log("-".repeat(30));
                });
            }
            console.log();
            resolve();
        });
    });
}

// Main execution
async function main() {
    const arg = process.argv[2];
    
    switch (arg) {
        case 'users':
            await showUsers();
            break;
        case 'images':
            await showImages();
            break;
        case 'logs':
            await showLogs();
            break;
        case 'config':
            await showConfig();
            break;
        case 'all':
        default:
            await showUsers();
            await showImages();
            await showLogs();
            await showConfig();
            break;
    }
    
    console.log("📊 Database view complete!");
}

main().catch(console.error);
