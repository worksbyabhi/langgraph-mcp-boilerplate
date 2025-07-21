import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, mcp-session-id"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Map to store transports by session ID for concurrent requests
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Create the MCP server instance
const server = new McpServer({
  name: "calculator-server",
  version: "1.0.0",
  description: "A simple calulator server",
});

// Define tools

server.tool(
  "add",
  "Add two numbers",
  {
    a: z.string(),
    b: z.string(),
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: `${parseInt(a) + parseInt(b)}`,
        },
      ],
    };
  }
);

server.tool(
  "subtract",
  "Subtract two numbers",
  {
    a: z.string(),
    b: z.string(),
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: `${parseInt(a) + parseInt(b)}`,
        },
      ],
    };
  }
);

// ---- HTTP Endpoints for MCP ----

// Handle POST requests for client-to-server communication (e.g, initialize, tools/call)

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;
  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        console.info(`[MCP server] New session initialized: ${newSessionId}`);
        transports[newSessionId] = transport;
      },
    });

    // Clean up the transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        console.info(`[MCP server] Session closed: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };

    // Connect the MCP server instance to this new transport
    await server.connect(transport);
  } else {
    console.error(
      `[MCP server] Invalid request: Session ID missing or invalid for non-initialize request. Body: ${JSON.stringify(
        req.body
      )}`
    );
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Bad Request: No valid session ID provided or invalid initialize request",
      },
      id: null,
    });
    return;
  }

  // Handle the request using the transport
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    console.info(
      `[MCP server] GET Request: Invalid or mission session ID: ${sessionId}`
    );
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  const transport = transports[sessionId];
  // Handle the request using the transport
  await transport.handleRequest(req, res, req.body);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    console.info(
      `[MCP server] DELETE Request: Invalid or mission session ID: ${sessionId}`
    );
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  const transport = transports[sessionId];
  // Handle the request using the transport
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(
    `[MCP server] Calculator MCP Server is running on http://localhost:${PORT}`
  );
  console.log(`[MCP server] Waiting for requests...`);
});

process.on("exit", () => {
  console.log(`[MCP server] Calculator MCP Server is shutting down`);
});

process.on("SIGINT", () => {
  console.log(`[MCP server] Calculator MCP Server is shutting down gracefully`);
  process.exit();
});

process.on("uncaughtException", (err) => {
  console.error(`[MCP server] Uncaught Exception: `, err);
  process.exit(1);
});
