import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
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
app.use(express.static(path.join(__dirname, "../") )) // serve static files from React App
app.use(express.json())
app.use(express.urlencoded({extended:true})) // for POST/PUT requests

const corsOptions  = {
  origin: ["http://localhost:5174"]
}
app.use(cors(corsOptions));

// Example route
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from the API!' });
});

// Example route
app.get('/', (req, res) => {
    console.log("server has started")
    res.json({ message: path.join(__dirname, "../", "index.html") });
    // res.sendFile("index.html"); // doesn't work without building
  });

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});