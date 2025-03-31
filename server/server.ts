import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {dirname} from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
dotenv.config()
// import { dot } from 'node:test/reporters';
const app = express();

// app.set('view engine','ejs') // in case I want to generate dynamic views

const SERVER_PORT = process.env.SERVER_PORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.static(path.join(__dirname, "../dist") )) // serve static files from React App
app.use(express.json())
app.use(express.urlencoded({extended:true})) // for POST/PUT requests

// const corsOptions  = {
//   origin: ["http://localhost:5173"]
// }
app.use(cors({
  origin: "http://localhost:5173", // Your React app's origin
  methods: ["GET", "POST", "PUT", "DELETE"], // Explicitly allow POST
  allowedHeaders: ["Content-Type"]
}));

// Modify your POST endpoint
app.post('/upload', (req, res) => {
  console.log("Received data:", req.body);
  if (!req.body) {
    res.status(400).json({ error: "No data received" });
  }
  res.status(200).json({ message: req.body });
  res.end();
});

app.post('/generate-image', async (req, res) => {
  const payload = req.body;

  // Validate input (customize based on your requirements)
  if (!payload || Object.keys(payload).length === 0) {
    res.status(400).json({error:'Invalid input'});
  }

  // Generate unique temp file paths
  const tempInputPath = `./server/temp/${uuidv4()}.json`;
  const tempOutputPath = `./server/temp/${uuidv4()}.png`;

  try {
    // Write JSON payload to temp file
    await fs.promises.writeFile(tempInputPath, JSON.stringify(payload));

    // Execute C++ program
    console.log("calling c++ raytracing program");
    const cppProcess = spawn('./server/cpp/RayTracing-Directed-Study/src/main.out', [tempOutputPath,tempInputPath]);

    // Handle process completion
    cppProcess.on('close', async (code) => {
      console.log("raytracing finished!");
      if (code !== 0) {
        cleanup(tempInputPath, tempOutputPath);
        res.status(500).json({error:'Failed to generate image'});
      }

      // Read and send the generated PNG
      try {
        const image = await fs.promises.readFile(tempOutputPath);
        res.type('png').send(image);
      } catch (err) {
        res.status(500).json({error:'Failed to read image', err: err});
      } finally {
        cleanup(tempInputPath,tempOutputPath);
      }
    });

  } catch (err) {
    cleanup(tempInputPath, tempOutputPath);
    res.status(500).json({message:'Internal server error',err: err});
  }
});

// Delete temporary files
function cleanup(...files) {
  files.forEach(file => {
    fs.unlink(file, (err) => {
      if (err) console.error(`Error deleting ${file}:`, err);
    });
  });
}

// Example route
app.get('/api/data', (req, res) => {
  res.json({ message: path.join(__dirname, ".", "index.html") });
});

// Example route
app.get('/', (req, res) => {
    console.log("server has started")
    // res.json({ message: path.join(__dirname, "../", "index.html") });
    res.sendFile("index.html"); // doesn't work without building
  });

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});