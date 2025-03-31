import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {dirname} from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
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