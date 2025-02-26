import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import {dirname} from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
// import { dot } from 'node:test/reporters';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const corsOptions  = {
  origin: ["http://localhost:5173"]
}

dotenv.config()

const app = express();
app.use(cors(corsOptions));

const SERVER_PORT = process.env.SERVER_PORT

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Example route
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from the API!' });
});

// Example route
app.get('/', (req, res) => {
    console.log("server has started")
    res.json({ message: path.join(__dirname, "../src", "index.html") });
  });

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});