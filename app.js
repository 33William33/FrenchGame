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
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(helmet());
app.use(cors());
app.use(cookieParser());

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

let images = new Datastore({
    filename: path.join(__dirname, "db", "images.db"),
    timestampData: true,
});
// let comments = new Datastore({
//     filename: path.join(__dirname, "db", "comments.db"),
//     timestampData: true,
// });
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
    res.redirect('/');
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
                comments.remove({ imageid: img._id }, { multi: true }, function (err, num) {
                    if (err) return res.status(500).end(err);
                    fs.unlinkSync('./uploads/' + img.filename);
                    serverConfig.update({ _id: "image" }, { next: img._id })
                    res.json(img);
                })

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

// app.get("/api/comments/", verifyToken, function (req, res, next) {
//     if (req.user) {
//         comments.find({}, function (err, comment) {
//             if (err) return res.status(500).end(err);
//             return res.json(comment)
//         })
//     }
//     else {
//         res.redirect('/');
//     }
// });
// app.get("/api/comments/:imageId/:page", verifyToken, function (req, res, next) {
//     if (req.user) {
//         let imageid = parseInt(req.params.imageId, 10);
//         let pageid = parseInt(req.params.page, 10);
//         images.findOne({ _id: imageid }, function (err, img) {
//             if (err) return res.status(500).end(err);
//             if (!img) {
//                 return res.status(404).end("Image Not Exists!");
//             }
//             if (pageid < 0) {
//                 return res.status(404).end("Invalid Page!");
//             }
//             comments.find({ imageid: imageid }).sort({ _id: -1 }).skip(pageid * 10).limit(10).exec(function (err, comment) {
//                 if (err) return res.status(500).end(err);
//                 if (!comment) {
//                     return res.status(404).end("Comments Not Exists!");
//                 }
//                 return res.json(comment);
//             })
//         })
//     }
//     else {
//         res.redirect('/');
//     }

// });

// app.post("/api/comments", verifyToken, function (req, res, next) {
//     if (req.user) {
//         comments.find({}).sort({ _id: -1 }).limit(1).exec(function (err, comment) {
//             if (err) return res.status(500).end("Error Getting Last Comment ID");
//             if (comment.length != 0) {
//                 imgid = parseInt(req.body.imageid, 10);

//                 images.findOne({ _id: imgid }, function (err, img) {
//                     if (err) return res.status(500).end(err);
//                     comments.insert({
//                         _id: comment[0]._id + 1,
//                         author: req.body.author,
//                         comment: req.body.comment,
//                         imageid: parseInt(req.body.imageid, 10),
//                         owner_id: req.user._id,
//                         img_owner_id: img.owner_id,
//                         date: new Date()
//                     }, function (err, comment) {
//                         if (err) return res.status(500).end(err);
//                         return res.json(comment);
//                     });

//                 });


//             } else {
//                 imgid = parseInt(req.body.imageid, 10);
//                 images.findOne({ _id: imgid }, function (err, img) {
//                     if (err) return res.status(500).end(err);
//                     comments.insert({
//                         _id: 1,
//                         author: req.body.author,
//                         comment: req.body.comment,
//                         imageid: parseInt(req.body.imageid, 10),
//                         owner_id: req.user._id,
//                         img_owner_id: img.owner_id,
//                         date: new Date()
//                     }, function (err, comment) {
//                         if (err) return res.status(500).end(err);
//                         return res.json(comment);
//                     });

//                 });

//             }
//         });
//     }
//     else {
//         res.redirect('/');
//     }

// });
// app.delete("/api/comments/:comid/", verifyToken, function (req, res, next) {
//     if (req.user) {
//         comid = parseInt(req.params.comid, 10)
//         comments.findOne({ _id: comid }, function (err, comment) {

//             if (err) return res.status(500).end(err);
//             if (!comment) {
//                 return res.json("")
//             }
//             if (JSON.stringify(comment.img_owner_id) === undefined) {
//                 if ([String(comment.owner_id), String(comment.img_owner_id)].includes(String(req.user._id))) {



//                     comments.remove({ _id: comment._id }, { multi: false }, function (err, num) {
//                         if (err) return res.status(500).end(err);
//                         res.json(comment);
//                     });
//                 }
//             }
//             else {
//                 if ([String(comment.owner_id), String(JSON.parse(JSON.stringify(comment.img_owner_id))._id), String(comment.img_owner_id)].includes(String(req.user._id))) {



//                     comments.remove({ _id: comment._id }, { multi: false }, function (err, num) {
//                         if (err) return res.status(500).end(err);
//                         res.json(comment);
//                     });
//                 }
//             }
//         });
//     }
//     else {
//         res.redirect('/')
//     }
// });
// app.put("/api/comments/:comid", verifyToken, function (req, res, next) {

//     if (req.user) {
//         comments.findOne({ _id: req.params.comid }, function (err, comment) {
//             if (err) return res.status(500).end(err);
//             if (!(comment && (req.user._id === img.owner_id))) {
//                 return res.status(404).end("Comment Not Exists!");
//             }
//             comments.update({ _id: comment._id }, { imageid: req.body.imageid, author: req.body.author, comment: req.body.comment }, { multi: false }, function (err, num) {
//                 if (err) return res.status(500).end(err);
//                 comments.findOne({ _id: req.params.comid }, function (err, comment) {
//                     if (err) return res.status(500).end(err);
//                     res.json(comment);
//                 })
//             });
//         });
//     }
//     else {
//         res.redirect('/');
//     }
// })

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

app.get("/api/game/", verifyToken, function (req, res, next) {
    if (req.user)
        res.json({ status: 'ready', gameUrl: '/game.html' });
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

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else {
        console.log("HTTP server on http://localhost:%s", PORT);
        images.loadDatabase()
        // comments.loadDatabase()
        serverConfig.loadDatabase()
        logs.loadDatabase()
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