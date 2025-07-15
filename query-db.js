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

// Load databases
users.loadDatabase();
images.loadDatabase();

console.log("=== NeDB Query Examples ===\n");

// Example queries
async function runQueries() {
    // Find user by username
    console.log("1. Find user with username '1':");
    users.findOne({ username: "1" }, (err, user) => {
        if (err) console.error(err);
        else {
            console.log(`   Found: ID ${user._id}, Username: ${user.username}`);
            console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}\n`);
        }
    });

    // Count total images
    console.log("2. Count total images:");
    images.count({}, (err, count) => {
        if (err) console.error(err);
        else console.log(`   Total images: ${count}\n`);
    });

    // Find images by specific owner
    console.log("3. Find images owned by user ID 1:");
    images.find({ owner_id: 1 }, (err, userImages) => {
        if (err) console.error(err);
        else {
            console.log(`   Found ${userImages.length} images:`);
            userImages.forEach(img => {
                console.log(`   - ${img.imageName} (${img.author})`);
            });
            console.log();
        }
    });

    // Find recent images (last 10)
    console.log("4. Last 10 images (sorted by date):");
    images.find({}).sort({ date: -1 }).limit(10).exec((err, recentImages) => {
        if (err) console.error(err);
        else {
            recentImages.forEach(img => {
                console.log(`   - ${img.imageName} (${new Date(img.date).toLocaleDateString()})`);
            });
            console.log();
        }
    });

    // Search images by name pattern
    console.log("5. Search images containing 'an' in name:");
    images.find({ imageName: { $regex: /an/ } }, (err, matchingImages) => {
        if (err) console.error(err);
        else {
            console.log(`   Found ${matchingImages.length} matching images:`);
            matchingImages.forEach(img => {
                console.log(`   - ${img.imageName}`);
            });
        }
    });
}

runQueries();
