import OpenAI from "openai";
import http from 'http';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fs from "fs";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Datastore from "@seald-io/nedb";
import path from "path";
import multer from "multer";
import favicon from "serve-favicon";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      mediaSrc: ["'self'", "blob:", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  })
);
app.use(cors());
app.use(cookieParser());

// Serve favicon
app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));

// const model = new OpenAI({
//     modelName: "dall-e-2", // or "dall-e-2"
//     apiKey: "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", // Replace with your key
//   });

const openai = new OpenAI({ apiKey: "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" });

let upload = multer({ dest: path.join(__dirname, "uploads") });


let users = new Datastore({
    filename: path.join(__dirname, "db", "users.db"),
    timestampData: true,
});

let logs = new Datastore({
    filename: path.join(__dirname, "db", "logs.db"),
    timestampData: true,
});

let matchGameLogs = new Datastore({
    filename: path.join(__dirname, "db", "match_game_logs.db"),
    timestampData: true,
});

let spellingGameLogs = new Datastore({
    filename: path.join(__dirname, "db", "spelling_game_logs.db"),
    timestampData: true,
});

let dropGameLogs = new Datastore({
    filename: path.join(__dirname, "db", "drop_game_logs.db"),
    timestampData: true,
});

let dropSentenceGameLogs = new Datastore({
    filename: path.join(__dirname, "db", "drop_sentence_game_logs.db"),
    timestampData: true,
});

let images = new Datastore({
    filename: path.join(__dirname, "db", "images.db"),
    timestampData: true,
});
// let comments = new Datastore({
//     filename: path.join(__dirname, "db", "comments.db"),
//     timestampData: true,
// });
let sentences = new Datastore({
    filename: path.join(__dirname, "db", "sentences.db"),
    timestampData: true,
});
let serverConfig = new Datastore({
    filename: path.join(__dirname, "db", "config.db"),
    timestampData: true,
})
app.use(function (req, res, next) {
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});
users.loadDatabase();

// translation-service.js
const translationCache = new Map();

async function translateText(text, targetLang = 'fr') {
    if (!text?.trim()) return text;
    
    // Cache check
    const cacheKey = `${targetLang}:${text}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    // Try multiple services with fallbacks
    let translated = text;
    const services = [
        tryDeepLTranslate, 
        tryMyMemoryTranslate,
    ];

    for (const service of services) {
        translated = await service(text, targetLang);
        if (translated !== text) break;
    }

    translationCache.set(cacheKey, translated);
    return translated;
}

async function tryDeepLTranslate(text, targetLang = 'EN') {
    try {
        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key 4e754ae8-8b62-40f3-9a73-a0e5fbb61f9f:fx`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: [text],
                target_lang: targetLang,
                preserve_formatting: true
            }),
            timeout: 3000
        });

        if (!response.ok) {
            throw new Error(`DeepL API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.translations[0].text;
    } catch (error) {
        console.error('DeepL translation failed:', error.message);
        return text; // Return original text as fallback
    }
}

async function tryMyMemoryTranslate(text) {
    try {
        const response = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
                q: text,
                langpair: 'en|fr',  // French to English
            },
            timeout: 3000
        });
        
        // Handle response format
        return response.data.responseData?.translatedText || text;
        
    } catch (error) {
        console.error('French to English translation failed:', error.message);
        return text; // Return original text if translation fails
    }
}



async function generateImage(p) {
    const prompt = `${p.trim()}`;
    try {
        // // Validate input
        // if (!p || typeof p !== "string") {
        //     throw new Error("Invalid prompt: must be a non-empty string");
        // }

        // // Generate image
        // const result = await new OpenAI({ apiKey: "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" }).images.generate({
        //     model: "dall-e-2", // Better quality than dall-e-2
        //     prompt: prompt,
        //     size: "512x512"
        // });



        // // Save the image to a file
        const uploadsDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        // // const safeFilename = prompt
        // //     .slice(0, 50) // Limit length
        // //     .toLowerCase()
        // //     .replace(/[^a-z0-9]/g, "_") +
        // //     `_${Date.now()}.png`;
        // const safeFilename = `${p.trim()}.png`;
        // const filePath = path.join(uploadsDir, safeFilename);
        // const imageBuffer = Buffer.from(result.data[0].b64_json, "base64");
        // fs.writeFileSync(filePath, imageBuffer);
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            response_format: "b64_json",
            n: 1,
            size: "1024x1024"
        });
        // const response = await openai.responses.create({
        //     model: "gpt-4.1-mini",
        //     input: prompt,
        //     tools: [{type: "image_generation"}],
        // });

        // Save the image to a file
        const imageData = response.data;

        if (imageData.length > 0) {
            const fs = await import("fs");
            const safeFilename = `${p.trim()}.png`;
            const filePath = path.join(uploadsDir, safeFilename);
            const imageBuffer = Buffer.from(imageData[0].b64_json, "base64");
            fs.writeFileSync(filePath, imageBuffer);
        }

    } catch (error) {
        console.error(`Image generation failed for prompt "${prompt}...":`, error.message);
        throw error; // Re-throw for caller to handle
    }
}


app.post("/register", function (req, res, next) {

    users.find({}).sort({ _id: -1 }).limit(1).exec(function (err, user) {
        if (err) return res.status(500).end("Error Getting Last User ID");
        if (user.length != 0) {
            users.insert({
                _id: user[0]._id + 1,
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, 8)
            }, function (err, user) {
                if (err) return res.status(500).end(err);
                return res.redirect('/');
            });

        } else {
            users.insert({
                _id: 1,
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, 8)
            }, function (err, user) {
                if (err) return res.status(500).end(err);
                return res.redirect('/');
            });
        }
    });


});

app.post("/signin", function (req, res, next) {
    users.findOne({
        username: req.body.username
    })
        .exec((err, user) => {
            if (err) {
                res.status(500)
                    .send({
                        message: err
                    });
                return;
            }
            if (!user) {
                return res.status(404)
                    .send({
                        message: "User Not found."
                    });
            }

            //comparing passwords
            var passwordIsValid = bcrypt.compareSync(
                req.body.password,
                user.password
            );
            // checking if password was valid and send response accordingly
            if (!passwordIsValid) {
                return res.status(401)
                    .send({
                        accessToken: null,
                        message: "Invalid Password!"
                    });
            }
            //signing token with user id
            var token = jwt.sign({
                id: user._id
            }, "secret", {
                expiresIn: 86400
            });

            //responding to client request with user profile success message and  access token .
            res.cookie("Authorization", "JWT " + token);
            res.redirect('/');
        });
});

const verifyToken = async (req, res, next) => {
    try {
      // 1. Check for valid Authorization cookie
      const authHeader = req.cookies?.Authorization;
      if (!authHeader || !authHeader.startsWith('JWT ')) {
        req.user = null;
        return next();
      }
  
      // 2. Extract and verify token
      const token = authHeader.split(' ')[1];
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        });
      });
  
      // 3. Verify decoded payload structure
      if (!decoded?.id) {
        throw new Error('Invalid token payload');
      }
  
      // 4. Find user in database
      const user = await new Promise((resolve, reject) => {
        users.findOne({ _id: decoded.id }, (err, user) => {
          if (err) return reject(err);
          resolve(user);
        });
      });
  
      if (!user) {
        throw new Error('User not found');
      }
  
      // 5. Attach user to request
      req.user = user;
      next();
  
    } catch (error) {
      console.error('Authentication error:', error.message);
      req.user = null;
      
      // For API routes, send error response
      if (req.path.startsWith('/api')) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          message: error.message 
        });
      }
      
      // For regular routes, continue without user
      next();
    }
  };

app.post("/logout", function (req, res, next) {
    res.clearCookie("Authorization");
    res.redirect('/logout.html');
});

app.get("/api/imgs/", verifyToken, function (req, res, next) {
    if (req.user) {
        images.find({}, function (err, imgs) {
            if (err) return res.status(500).end(err);
            return res.json(imgs)
        })
    }
    else {
        res.redirect('/');
    }
});
app.get("/api/imgs/:imgid", verifyToken, function (req, res, next) {
    if (req.user) {
        let imgid = parseInt(req.params.imgid, 10)
        images.findOne({ _id: imgid }, function (err, img) {
            if (err) return res.status(500).end(err);
            if (!img) {
                return res.status(404).end("Image Not Exists!");
            }
            return res.json(img);
        })
    }
    else {
        res.redirect('/');
    }
});
app.post("/api/imgs/", verifyToken, upload.single("picture"), function (req, res, next) {
    if (req.user)
        images.count({}, function (err, count) {
            if (err) return res.status(500).end(err);
            images.find({ imageName: req.body.imgt }, function (err, img) {
                if (err) return res.status(500).end(err);
                serverConfig.findOne({ _id: "image" }, function (err, cfg) {

                    if (err) return res.status(500).end(err);
                    if (img.length != 0) return res.status(409).end("image title " + req.body.imgt + " already exists");

                    let nextId = cfg.next
                    if (nextId == 0) {
                        console.log("go to 0")
                        generateImage(req.body.title)
                            .then(result => console.log(`Image saved to: ${result.path}`))
                            .catch(err => console.error("Error:", err.message));
                        images.insert({
                            _id: count + 1,
                            imageName: req.body.title,
                            author: req.body.author,
                            url: "/api/uploads/" + req.body.title + ".png",
                            filename: req.body.title + ".png",
                            owner_id: req.user._id,
                            date: new Date()
                        }, function (err, secImg) {
                            if (err) return res.status(500).end(err);
                            res.redirect("/?img=" + secImg._id);
                        });
                    } else {
                        console.log("go to 1")
                        generateImage(req.body.title)
                            .then(result => console.log(`Image saved to: ${result.path}`))
                            .catch(err => console.error("Error:", err.message));
                        images.insert({
                            _id: nextId,
                            imageName: req.body.title,
                            author: req.body.author,
                            url: "/api/uploads/" + req.body.title,
                            filename: req.body.title,
                            owner_id: req.user._id,
                            date: new Date()
                        }, function (err, secImg) {
                            if (err) return res.status(500).end(err);
                            serverConfig.update({ _id: "image" }, { next: 0 }, {}, function (err, num) { })
                            res.redirect("/?img=" + secImg._id);
                        });
                    }

                })


            })
        });
    else
        res.redirect('/')
});
app.delete("/api/imgs/:imgid/", verifyToken, function (req, res, next) {
    if (req.user) {
        imgid = parseInt(req.params.imgid, 10);
        images.findOne({ _id: imgid }, function (err, img) {
            if (err) return res.status(500).end(err);
            if (!(img && (req.user._id === img.owner_id))) {
                return res.json("")
            }
            images.remove({ _id: img._id }, { multi: false }, function (err, num) {
                if (err) return res.status(500).end(err);
                // Remove the file if it exists
                try {
                    if (fs.existsSync('./uploads/' + img.filename)) {
                        fs.unlinkSync('./uploads/' + img.filename);
                    }
                } catch (fileErr) {
                    console.error('Error deleting file:', fileErr);
                }
                serverConfig.update({ _id: "image" }, { next: img._id })
                res.json(img);
            });
        });
    }
    else {
        res.redirect('/')
    }
});
app.put("/api/imgs/:imgid", verifyToken, function (req, res, next) {
    if (req.user) {
        imgid = parseInt(req.params.imgid, 10);
        images.findOne({ _id: imgid }, function (err, img) {
            if (err) return res.status(500).end(err);
            if (!(img && (req.user._id === img.owner_id))) {
                return res.status(404).end("Image Not Exists or you're not the owner!");
            }
            images.update({ _id: img._id }, { imageName: req.body.title, author: req.body.author }, { multi: false }, function (err, num) {
                if (err) return res.status(500).end(err);
                images.findOne({ _id: imgid }, function (err, img) {
                    if (err) return res.status(500).end(err);
                    res.json(img);
                });
            });
        });
        return;
    }
    else {
        res.redirect('/');
    }
});


app.get("/api/uploads/:filename", function (req, res, next) {
    res.sendFile(path.resolve("./uploads/" + req.params.filename));
});

app.use(express.static("static"));

app.use(express.static("uploads"));

app.get("/", verifyToken, function (req, res, next) {
    if (req.user)
        res.sendfile('static/index1.html');
    else
        res.redirect('login.html');
});

app.get("/logs", verifyToken, function (req, res, next) {
    if (req.user)
        res.sendfile('static/logs.html');
    else
        res.redirect('login.html');
});

app.get("/drop", verifyToken, function (req, res, next) {
    if (req.user)
        res.sendfile('static/drop.html');
    else
        res.redirect('login.html');
});

app.get("/api/game/", verifyToken, function (req, res, next) {
    if (req.user)
        res.json({ status: 'ready', gameUrl: '/game.html' });
    else
        res.redirect('/');
});

app.get("/api/spell/", verifyToken, function (req, res, next) {
    if (req.user)
        res.json({ status: 'ready', spellUrl: '/spell.html' });
    else
        res.redirect('/');
});

app.get("/api/drop/", verifyToken, function (req, res, next) {
    if (req.user)
        res.json({ status: 'ready', dropUrl: '/drop.html' });
    else
        res.redirect('/');
});

// app.js
app.get("/api/trans/:imgid", verifyToken, async (req, res) => {
    try {
        if (!req.user) return res.status(401).end();

        const imgid = parseInt(req.params.imgid);
        const img = await new Promise((resolve, reject) => {
            images.findOne({ _id: imgid }, (err, doc) => err ? reject(err) : resolve(doc));
        });

        if (!img) return res.status(404).end();

        // Only translate if not already translated
        if (1 === 1) {
            const translatedText = await translateText(img.imageName);
            
            await new Promise((resolve, reject) => {
                images.update(
                    { _id: imgid },
                    { 
                        $set: { 
                            author: translatedText,
                            translated: true,
                            translatedAt: new Date() 
                        }
                    },
                    {},
                    (err, numReplaced) => {
                        if (err) reject(err);
                        console.log(`Image ${imgid} updated (translated)`);
                        resolve();
                    }
                );
            });
        }

        res.json(img);

    } catch (err) {
        console.error(`Error in /api/trans/${req.params.imgid}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Debug endpoints to view database contents
app.get("/api/debug/users", verifyToken, function (req, res, next) {
    if (req.user) {
        users.find({}, function (err, data) {
            if (err) return res.status(500).end(err);
            // Remove passwords for security
            const safeData = data.map(user => ({
                _id: user._id,
                username: user.username,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }));
            return res.json(safeData);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get("/api/debug/images", verifyToken, function (req, res, next) {
    if (req.user) {
        images.find({}, function (err, data) {
            if (err) return res.status(500).end(err);
            return res.json(data);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get("/api/debug/logs", verifyToken, function (req, res, next) {
    if (req.user) {
        logs.find({}, function (err, data) {
            if (err) return res.status(500).end(err);
            return res.json(data);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get("/api/debug/config", verifyToken, function (req, res, next) {
    if (req.user) {
        serverConfig.find({}, function (err, data) {
            if (err) return res.status(500).end(err);
            return res.json(data);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get("/api/debug/match-game-logs", verifyToken, function (req, res, next) {
    if (req.user) {
        matchGameLogs.find({}).sort({ date: -1 }).exec(function (err, data) {
            if (err) return res.status(500).end(err);
            return res.json(data);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get("/api/debug/spelling-game-logs", verifyToken, function (req, res, next) {
    if (req.user) {
        spellingGameLogs.find({}).sort({ date: -1 }).exec(function (err, data) {
            if (err) return res.status(500).end(err);
            return res.json(data);
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.get("/api/user/current", verifyToken, function (req, res, next) {
    if (req.user) {
        // Return user info without password
        res.json({
            _id: req.user._id,
            username: req.user.username,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Match Game Logging
app.post("/api/match-game/log", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { totalQuestions, correctAnswers, incorrectAnswers, completionTime, gameData, level } = req.body;

    matchGameLogs.count({}, function (err, count) {
        if (err) return res.status(500).json({ error: err.message });

        const logEntry = {
            _id: count + 1,
            userId: req.user._id,
            username: req.user.username,
            totalQuestions: totalQuestions || 0,
            correctAnswers: correctAnswers || 0,
            incorrectAnswers: incorrectAnswers || 0,
            score: correctAnswers && totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
            completionTime: completionTime || null, // in seconds
            level: level !== undefined ? level : 0, // level information (0-based)
            gameData: gameData || null, // detailed game session data
            gameType: 'match',
            date: new Date()
        };

        matchGameLogs.insert(logEntry, function (err, doc) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, logId: doc._id, score: logEntry.score });
        });
    });
});

// Spelling Game Logging
app.post("/api/spelling-game/log", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { totalQuestions, correctAnswers, incorrectAnswers, completionTime, gameData, level } = req.body;

    spellingGameLogs.count({}, function (err, count) {
        if (err) return res.status(500).json({ error: err.message });

        const logEntry = {
            _id: count + 1,
            userId: req.user._id,
            username: req.user.username,
            totalQuestions: totalQuestions || 0,
            correctAnswers: correctAnswers || 0,
            incorrectAnswers: incorrectAnswers || 0,
            score: correctAnswers && totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
            completionTime: completionTime || null, // in seconds
            level: level !== undefined ? level : 0, // level information (0-based)
            gameData: gameData || null, // detailed game session data
            gameType: 'spelling',
            date: new Date()
        };

        spellingGameLogs.insert(logEntry, function (err, doc) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, logId: doc._id, score: logEntry.score });
        });
    });
});

// Drop Game Logging
app.post("/api/drop-game/log", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { totalQuestions, correctAnswers, incorrectAnswers, completionTime, gameData, level } = req.body;

    // Find the highest existing ID and increment it
    dropGameLogs.find({}).sort({ _id: -1 }).limit(1).exec(function (err, docs) {
        if (err) return res.status(500).json({ error: err.message });

        const nextId = docs.length > 0 ? docs[0]._id + 1 : 1;

        const logEntry = {
            _id: nextId,
            userId: req.user._id,
            username: req.user.username,
            totalQuestions: totalQuestions || 0,
            correctAnswers: correctAnswers || 0,
            incorrectAnswers: incorrectAnswers || 0,
            score: correctAnswers && totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
            completionTime: completionTime || null, // in seconds
            level: level !== undefined ? level : 0, // level information (0-based)
            gameData: gameData || null, // detailed game session data
            gameType: 'drop',
            date: new Date()
        };

        dropGameLogs.insert(logEntry, function (err, doc) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, logId: doc._id, score: logEntry.score });
        });
    });
});

// Update Drop Game Log
app.put("/api/drop-game/log/:logId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const logId = parseInt(req.params.logId);
    const { totalQuestions, correctAnswers, incorrectAnswers, completionTime, gameData, score, level } = req.body;

    const updateData = {
        totalQuestions: totalQuestions || 0,
        correctAnswers: correctAnswers || 0,
        incorrectAnswers: incorrectAnswers || 0,
        score: score || 0,
        completionTime: completionTime || 0,
        level: level !== undefined ? level : 0, // level information (0-based)
        gameData: gameData || null,
        updatedAt: new Date()
    };

    dropGameLogs.update({ _id: logId, userId: req.user._id }, { $set: updateData }, {}, function (err, numReplaced) {
        if (err) return res.status(500).json({ error: err.message });
        if (numReplaced === 0) {
            return res.status(404).json({ error: 'Log entry not found or unauthorized' });
        }
        res.json({ success: true, logId: logId, updated: true });
    });
});

// Cleanup duplicate Drop Game logs (admin endpoint)
app.post("/api/drop-game/cleanup", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find all entries grouped by ID
    dropGameLogs.find({}).sort({ _id: 1, updatedAt: -1 }).exec(function (err, allLogs) {
        if (err) return res.status(500).json({ error: err.message });

        const duplicateGroups = {};
        const toRemove = [];

        // Group entries by ID
        allLogs.forEach(log => {
            if (!duplicateGroups[log._id]) {
                duplicateGroups[log._id] = [];
            }
            duplicateGroups[log._id].push(log);
        });

        // For each ID that has duplicates, keep only the most recently updated one
        Object.keys(duplicateGroups).forEach(id => {
            const group = duplicateGroups[id];
            if (group.length > 1) {
                // Sort by updatedAt (most recent first), then by createdAt
                group.sort((a, b) => {
                    const aTime = a.updatedAt || a.createdAt;
                    const bTime = b.updatedAt || b.createdAt;
                    return new Date(bTime) - new Date(aTime);
                });
                
                // Mark all but the first (most recent) for removal
                for (let i = 1; i < group.length; i++) {
                    toRemove.push(group[i]);
                }
            }
        });

        if (toRemove.length === 0) {
            return res.json({ success: true, message: 'No duplicates found', removed: 0 });
        }

        // Remove duplicates
        let removedCount = 0;
        const removePromises = toRemove.map(log => {
            return new Promise((resolve) => {
                dropGameLogs.remove({ _id: log._id, createdAt: log.createdAt }, {}, function (err, numRemoved) {
                    if (!err && numRemoved > 0) {
                        removedCount++;
                    }
                    resolve();
                });
            });
        });

        Promise.all(removePromises).then(() => {
            res.json({ 
                success: true, 
                message: `Cleanup completed. Removed ${removedCount} duplicate entries.`,
                removed: removedCount 
            });
        });
    });
});

// Get Match Game Stats
app.get("/api/match-game/stats/:userId?", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.params.userId ? parseInt(req.params.userId) : req.user._id;
    
    // Only allow users to see their own stats unless admin functionality is added later
    if (userId !== req.user._id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    matchGameLogs.find({ userId: userId }).sort({ date: -1 }).exec(function (err, logs) {
        if (err) return res.status(500).json({ error: err.message });
        
        const stats = {
            totalGames: logs.length,
            averageScore: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.score, 0) / logs.length) : 0,
            bestScore: logs.length > 0 ? Math.max(...logs.map(log => log.score)) : 0,
            totalCorrectAnswers: logs.reduce((sum, log) => sum + log.correctAnswers, 0),
            totalQuestions: logs.reduce((sum, log) => sum + log.totalQuestions, 0),
            recentGames: logs // All games, sorted by date (newest first)
        };
        
        res.json(stats);
    });
});

// Get Individual Match Game Details
app.get("/api/match-game/details/:gameId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const gameId = parseInt(req.params.gameId);
    
    matchGameLogs.findOne({ _id: gameId, userId: req.user._id }, function (err, game) {
        if (err) return res.status(500).json({ error: err.message });
        if (!game) return res.status(404).json({ error: 'Game not found' });
        
        res.json(game);
    });
});

// Get Spelling Game Stats
app.get("/api/spelling-game/stats/:userId?", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.params.userId ? parseInt(req.params.userId) : req.user._id;
    
    // Only allow users to see their own stats unless admin functionality is added later
    if (userId !== req.user._id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    spellingGameLogs.find({ userId: userId }).sort({ date: -1 }).exec(function (err, logs) {
        if (err) return res.status(500).json({ error: err.message });
        
        const stats = {
            totalGames: logs.length,
            averageScore: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.score, 0) / logs.length) : 0,
            bestScore: logs.length > 0 ? Math.max(...logs.map(log => log.score)) : 0,
            totalCorrectAnswers: logs.reduce((sum, log) => sum + log.correctAnswers, 0),
            totalQuestions: logs.reduce((sum, log) => sum + log.totalQuestions, 0),
            recentGames: logs // All games, sorted by date (newest first)
        };
        
        res.json(stats);
    });
});

// Get Individual Spelling Game Details
app.get("/api/spelling-game/details/:gameId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const gameId = parseInt(req.params.gameId);
    
    spellingGameLogs.findOne({ _id: gameId, userId: req.user._id }, function (err, game) {
        if (err) return res.status(500).json({ error: err.message });
        if (!game) return res.status(404).json({ error: 'Game not found' });
        
        res.json(game);
    });
});

// Get Drop Game Stats
app.get("/api/drop-game/stats/:userId?", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.params.userId ? parseInt(req.params.userId) : req.user._id;
    
    // Only allow users to see their own stats unless admin functionality is added later
    if (userId !== req.user._id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    dropGameLogs.find({ userId: userId }).sort({ date: -1 }).exec(function (err, logs) {
        if (err) return res.status(500).json({ error: err.message });
        
        const stats = {
            totalGames: logs.length,
            averageScore: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.score, 0) / logs.length) : 0,
            bestScore: logs.length > 0 ? Math.max(...logs.map(log => log.score)) : 0,
            totalCorrectAnswers: logs.reduce((sum, log) => sum + log.correctAnswers, 0),
            totalQuestions: logs.reduce((sum, log) => sum + log.totalQuestions, 0),
            recentGames: logs // All games, sorted by date (newest first)
        };
        
        res.json(stats);
    });
});

// Get Individual Drop Game Details
app.get("/api/drop-game/details/:gameId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const gameId = parseInt(req.params.gameId);
    
    dropGameLogs.findOne({ _id: gameId, userId: req.user._id }, function (err, game) {
        if (err) return res.status(500).json({ error: err.message });
        if (!game) return res.status(404).json({ error: 'Game not found' });
        
        res.json(game);
    });
});

// Drop Sentence Game API endpoints
// Log Drop Sentence Game Result
app.post("/api/drop-sentence-game/log", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { totalSentences, correctAnswers, incorrectAnswers, completionTime, gameData, level, questionResults, duration } = req.body;

    // Find the highest existing ID and increment it
    dropSentenceGameLogs.find({}).sort({ _id: -1 }).limit(1).exec(function (err, docs) {
        if (err) return res.status(500).json({ error: err.message });

        const nextId = docs.length > 0 ? docs[0]._id + 1 : 1;

        const logEntry = {
            _id: nextId,
            userId: req.user._id,
            username: req.user.username,
            totalQuestions: (correctAnswers || 0) + (incorrectAnswers || 0), // Calculate total questions like other games
            correctAnswers: correctAnswers || 0,
            incorrectAnswers: incorrectAnswers || 0,
            score: correctAnswers && totalSentences ? Math.round((correctAnswers / totalSentences) * 100) : 0,
            completionTime: completionTime || (duration ? Math.round(duration / 1000) : null), // in seconds
            duration: duration || null, // in milliseconds
            level: level !== undefined ? level : 0, // level information (0-based)
            gameData: gameData || null, // detailed game session data like other games
            gameType: 'drop-sentence',
            date: new Date()
        };

        dropSentenceGameLogs.insert(logEntry, function (err, doc) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, logId: doc._id, score: logEntry.score });
        });
    });
});

// Update Drop Sentence Game Log
app.put("/api/drop-sentence-game/log/:logId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const logId = parseInt(req.params.logId);
    const { correctAnswers, incorrectAnswers, completionTime, gameData, questionResults, gameEndTime, duration } = req.body;

    const updateData = {};
    if (correctAnswers !== undefined) updateData.correctAnswers = correctAnswers;
    if (incorrectAnswers !== undefined) updateData.incorrectAnswers = incorrectAnswers;
    if (completionTime !== undefined) updateData.completionTime = completionTime;
    if (duration !== undefined) {
        updateData.duration = duration;
        updateData.completionTime = Math.round(duration / 1000); // Convert to seconds
    }
    if (gameData !== undefined) updateData.gameData = gameData;
    if (questionResults !== undefined) updateData.questionResults = questionResults;
    if (gameEndTime !== undefined) updateData.gameEndTime = gameEndTime;

    // Calculate totalQuestions like other games
    if (correctAnswers !== undefined || incorrectAnswers !== undefined) {
        updateData.totalQuestions = (correctAnswers || 0) + (incorrectAnswers || 0);
        const total = updateData.totalQuestions;
        updateData.score = total > 0 ? Math.round(((correctAnswers || 0) / total) * 100) : 0;
    }

    dropSentenceGameLogs.update({ _id: logId, userId: req.user._id }, { $set: updateData }, {}, function (err, numReplaced) {
        if (err) return res.status(500).json({ error: err.message });
        if (numReplaced === 0) {
            return res.status(404).json({ error: 'Log entry not found or unauthorized' });
        }
        res.json({ success: true, logId: logId, updated: true });
    });
});

// Get Drop Sentence Game Stats
app.get("/api/drop-sentence-game/stats/:userId?", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.params.userId ? parseInt(req.params.userId) : req.user._id;
    
    // Only allow users to see their own stats unless admin functionality is added later
    if (userId !== req.user._id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    dropSentenceGameLogs.find({ userId: userId }).sort({ date: -1 }).exec(function (err, logs) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Recalculate scores for records where score is 0 but there are correct answers
        const logsWithFixedScores = logs.map(log => {
            let score = log.score;
            if (score === 0 && log.correctAnswers > 0) {
                const totalQuestions = log.totalQuestions || (log.correctAnswers + log.incorrectAnswers);
                score = totalQuestions > 0 ? Math.round((log.correctAnswers / totalQuestions) * 100) : 0;
            }
            return { ...log, score: score };
        });
        
        const stats = {
            totalGames: logs.length,
            averageScore: logsWithFixedScores.length > 0 ? Math.round(logsWithFixedScores.reduce((sum, log) => sum + log.score, 0) / logsWithFixedScores.length) : 0,
            bestScore: logsWithFixedScores.length > 0 ? Math.max(...logsWithFixedScores.map(log => log.score)) : 0,
            totalCorrectAnswers: logs.reduce((sum, log) => sum + log.correctAnswers, 0),
            totalQuestions: logs.reduce((sum, log) => sum + (log.totalQuestions || (log.correctAnswers + log.incorrectAnswers)), 0),
            recentGames: logsWithFixedScores.map(game => ({
                ...game,
                totalQuestions: game.totalQuestions || (game.correctAnswers + game.incorrectAnswers)
            })) // All games, sorted by date (newest first)
        };
        
        res.json(stats);
    });
});

// Get Individual Drop Sentence Game Details
app.get("/api/drop-sentence-game/details/:gameId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const gameId = parseInt(req.params.gameId);
    
    dropSentenceGameLogs.findOne({ _id: gameId, userId: req.user._id }, function (err, game) {
        if (err) return res.status(500).json({ error: err.message });
        if (!game) return res.status(404).json({ error: 'Game not found' });
        
        // Recalculate score if it's 0 but there are correct answers
        let score = game.score;
        if (score === 0 && game.correctAnswers > 0) {
            const totalQuestions = game.totalQuestions || (game.correctAnswers + game.incorrectAnswers);
            score = totalQuestions > 0 ? Math.round((game.correctAnswers / totalQuestions) * 100) : 0;
        }
        
        // Format the game data for the logs display
        const formattedGame = {
            ...game,
            score: score, // Use the recalculated score
            totalQuestions: game.totalQuestions || (game.correctAnswers + game.incorrectAnswers),
            completionTime: game.completionTime || (game.duration ? Math.round(game.duration / 1000) : null),
            date: game.date || game.createdAt,
            gameData: game.gameData || {
                questions: (game.questionResults || []).map(result => ({
                    questionId: result.questionId || 1,
                    question: result.sentence || 'N/A',
                    correctAnswer: result.correctAnswer || result.correctWord,
                    selectedAnswer: result.selectedAnswer || result.selectedWord || 'No answer',
                    userAnswer: result.selectedAnswer || result.selectedWord || 'No answer',
                    isCorrect: result.isCorrect,
                    timestamp: result.timestamp
                }))
            }
        };
        
        res.json(formattedGame);
    });
});

// Proxy endpoint for Google Translate TTS to avoid CORS issues
app.get("/api/tts/:text", verifyToken, async function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const text = decodeURIComponent(req.params.text);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(text)}`;
        
        const response = await axios.get(ttsUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': response.data.length,
            'Cache-Control': 'public, max-age=3600'
        });
        
        res.send(response.data);
    } catch (error) {
        console.error('TTS proxy error:', error.message);
        res.status(500).json({ error: 'TTS service unavailable' });
    }
});

// Sentences API endpoints
// Get sentence for a specific image
app.get("/api/sentences/:imageId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const imageId = parseInt(req.params.imageId);
    sentences.findOne({ imageId: imageId }, function (err, sentence) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
        res.json(sentence);
    });
});

// Create or update sentence for a specific image
app.post("/api/sentences/:imageId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const imageId = parseInt(req.params.imageId);
    const { sentence } = req.body;

    if (!sentence || sentence.trim() === '') {
        return res.status(400).json({ error: 'Sentence is required' });
    }

    // First get the image to get the word (author field)
    images.findOne({ _id: imageId }, function (err, image) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!image) return res.status(404).json({ error: 'Image not found' });

        // Check if sentence already exists
        sentences.findOne({ imageId: imageId }, function (err, existingSentence) {
            if (err) return res.status(500).json({ error: 'Database error' });

            const sentenceData = {
                imageId: imageId,
                word: image.author,
                sentence: sentence.trim()
            };

            if (existingSentence) {
                // Update existing sentence
                sentences.update({ imageId: imageId }, { $set: sentenceData }, {}, function (err, numReplaced) {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ message: 'Sentence updated successfully', ...sentenceData });
                });
            } else {
                // Create new sentence
                sentences.insert(sentenceData, function (err, newSentence) {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.status(201).json(newSentence);
                });
            }
        });
    });
});

// Delete sentence for a specific image
app.delete("/api/sentences/:imageId", verifyToken, function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const imageId = parseInt(req.params.imageId);
    sentences.remove({ imageId: imageId }, {}, function (err, numRemoved) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (numRemoved === 0) return res.status(404).json({ error: 'Sentence not found' });
        res.json({ message: 'Sentence deleted successfully' });
    });
});

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else {
        console.log("HTTP server on http://localhost:%s", PORT);
        images.loadDatabase()
        // comments.loadDatabase()
        sentences.loadDatabase()
        serverConfig.loadDatabase()
        logs.loadDatabase()
        matchGameLogs.loadDatabase()
        spellingGameLogs.loadDatabase()
        dropGameLogs.loadDatabase()
        dropSentenceGameLogs.loadDatabase()
        serverConfig.count({}, function (err, count) {
            if (err) console.log(err)
            if (count == 0) {
                serverConfig.insert({ _id: "image", next: 0 }, function (err, res) {
                    if (err) console.log(err)
                })

            }
        })
    }

});