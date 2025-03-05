if (!Deno.env.get("OPENAI_API_KEY")) {
  console.error("Please set OPENAI_API_KEY environment variable");
  Deno.exit(1);
}

console.log("Server starting up...");
console.log("OpenAI API key is configured");

// Serve static HTML
const html = `<!DOCTYPE html>
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
        console.log('Frontend JavaScript loaded');
        
        async function sendPrompt() {
            const promptText = document.getElementById('prompt').value;
            const responseDiv = document.getElementById('response');
            
            console.log('Sending prompt:', promptText);
            responseDiv.style.display = 'block';
            responseDiv.textContent = 'Loading...';
            
            try {
                console.log('Making fetch request to /chat endpoint');
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: promptText }),
                });
                
                console.log('Received response status:', response.status);
                const data = await response.json();
                console.log('Parsed response data:', data);
                
                responseDiv.textContent = data.response;
            } catch (error) {
                console.error('Error in sendPrompt:', error);
                responseDiv.textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>`;

// Create server
console.log("Setting up server routes...");

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  console.log(`${req.method} request to ${url.pathname}`);

  if (req.method === "GET" && url.pathname === "/") {
    console.log("Serving HTML page");
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (req.method === "POST" && url.pathname === "/chat") {
    try {
      console.log("Processing chat request");
      const { message } = await req.json();
      console.log("Received message:", message);

      console.log("Making request to OpenAI API");
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: message }],
          }),
        },
      );

      console.log("OpenAI API response status:", response.status);
      const data = await response.json();
      console.log("OpenAI API response data:", data);

      if (!response.ok) {
        console.error("OpenAI API error:", data);
        throw new Error(
          "OpenAI API error: " + (data.error?.message || "Unknown error"),
        );
      }

      const aiResponse = data.choices[0].message.content;
      console.log("AI response:", aiResponse);

      return new Response(
        JSON.stringify({ response: aiResponse }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to process request",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  console.log("Route not found");
  return new Response(
    JSON.stringify({ error: "Not Found" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
});
