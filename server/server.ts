import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { dot } from 'node:test/reporters';

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
    res.json({ message: 'Welcome Home!' });
  });

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});