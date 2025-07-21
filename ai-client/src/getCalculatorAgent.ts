import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { llm } from "./model";
import { getMcpClient } from "./getMcpClient";

export const getCalculatorAgent = async () => {
  const mcpServerUrl = process.env.MCP_SERVER_URL;
  if (!mcpServerUrl) {
    throw new Error("missing mcp server url");
  }
  const client = await getMcpClient(mcpServerUrl);
  if (client) {
    const tools = await loadMcpTools("calculator-server", client);
    const agent = createReactAgent({
      llm,
      tools,
    });
    return agent;
  } else {
    throw new Error("Could not create getCalculatorAgent");
  }
};
