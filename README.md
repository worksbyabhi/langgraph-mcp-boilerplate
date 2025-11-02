# Introduction

This project demonstrates how to build an AI Calculator Agent in TypeScript that uses tools from an external MCP server.

**What it does?** It features a simple **Calculator Agent** (built with LangGraph) that consumes tools from a completely separate **MCP Tool Server** (built with Express.js).

## Core Architecture

The main goal of this project wasn't just to make an agent, but to build a **clean and scalable system**. The architecture is an "agent-as-a-client" model, which has several major advantages.

- **Decoupled Services:** The project is split into two independent `npm` projects:

  - `ai-client`: A LangGraph-based agent responsible for reasoning and task execution.
  - `mcp-server`: An Express.js server that does one thing: securely provide tools (like `add` and `subtract`) over the network.

- **Dynamic Tool Loading:** The AI agent doesn't have the tool logic built-in. Instead, it dynamically discovers and consumes tools from the MCP server at runtime using `loadMcpTools`.

  > **Why this is cool:** You can update, restart, or add _new_ tools to the `mcp-server` (e.g., `multiply`, `divide`) without **ever** touching or restarting the `ai-client`.

- **Uses the MCP Protocol:** Use of the **Model Context Protocol (MCP)** as the communication standard between the client and server avoids the need to design a custom, brittle REST API and leverages a protocol built specifically for agent-tool interaction.

- **Handles Multiple Sessions:** The `mcp-server` correctly manages concurrent user sessions using the `StreamableHTTPServerTransport`. It maps session IDs to individual transport instances and includes proper cleanup logic (`onclose`) to prevent memory leaks as sessions are terminated.

- **Zod-based Tool Validation:** By using **Zod** on the server to define tool schemas, we get runtime validation and static type-safety, which drastically reduces integration bugs.

## How to Run Locally

You'll need two separate terminals to run both the server and the client.

**Prerequisites:**

- Node.js (v20+ recommended)
- `npm` (or `yarn` / `pnpm`)
- A Google AI API Key

### 1. Configure Environment

The `ai-client` needs a `.env` file. Navigate to the `ai-client/` directory, create a `.env` file, and add your API key.

```ini
# ai-client/.env

# Get your key from [https://aistudio.google.com/](https://aistudio.google.com/)
GOOGLE_API_KEY="your-google-api-key-here"

# This points to our local mcp-server
MCP_SERVER_URL="http://localhost:3001/mcp"
```

### 2. Terminal 1: Run the MCP Server

This server provides the `add` and `subtract` tools to any agent that connects.

```ini
# Navigate to the server directory
cd mcp-server

# Install dependencies
npm install

# Build and run the server
npm run dev
```

### 3. Terminal 2: Run the AI Client

This will spin up the agent, which will connect to the server, ask its question, use the tools, and give you a final answer.

```ini
# Navigate to the client directory
cd ai-client

# Install dependencies
npm install

# Build and run the client
npm run dev

# You should see the agent connect, call the tools, and log the final result:
# Agent connected
# "4 plus 5 is 9, and 6 minus 3 is 3."
```
