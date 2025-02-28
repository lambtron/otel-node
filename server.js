require("./telemetry"); // Load OpenTelemetry setup
require("dotenv").config();
const express = require("express");
const winston = require("winston");
const logDir = "/var/log/otel-node";

// Create log directory if it doesn't exist
const fs = require("fs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Setup Winston to output to `logDir`.
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.File({ filename: `${logDir}/node-express-app.log` }),
  ],
});

// Log errors.
logger.on("error", (error) => {
  console.error("Logger error:", error);
});

// Modify the request logger to include more information
const requestLogger = (req, _res, next) => {
  logger.info("HTTP Request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    headers: req.headers,
    timestamp: new Date().toISOString(),
    body: req.method === "POST" ? req.body : undefined,
  });
  next();
};

// Middleware to parse JSON bodies
app.use(express.json());
app.use(requestLogger);

// Serve static HTML
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
  <html>
  <head>
      <title>ChatGPT Interface</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
          }
          .container {
              display: flex;
              flex-direction: column;
              gap: 20px;
          }
          textarea {
              width: 100%;
              height: 100px;
              padding: 10px;
          }
          button {
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
          }
          button:hover {
              background-color: #45a049;
          }
          #response {
              white-space: pre-wrap;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 4px;
              display: none;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>ChatGPT Interface</h1>
          <textarea id="prompt" placeholder="Enter your prompt here..."></textarea>
          <button onclick="sendPrompt()">Send to ChatGPT</button>
          <div id="response"></div>
      </div>
      <script>
          async function sendPrompt() {
              const promptText = document.getElementById('prompt').value;
              const responseDiv = document.getElementById('response');
              
              responseDiv.style.display = 'block';
              responseDiv.textContent = 'Loading...';
              
              try {
                  const response = await fetch('/api/chat', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ prompt: promptText }),
                  });
                  
                  const data = await response.json();
                  responseDiv.textContent = data.response;
              } catch (error) {
                  responseDiv.textContent = 'Error: ' + error.message;
              }
          }
      </script>
  </body>
</html>`);
});

// Chat API endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Prompt:", prompt);

    // Add your hardcoded system prompt here
    const systemPrompt =
      "You are a helpful AI assistant. Please provide clear and concise responses.";

    console.log("Sending request to OpenAI...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    console.log("Received response from OpenAI");
    const data = await response.json();

    res.json({
      response: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  logger.info("Application started", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});
