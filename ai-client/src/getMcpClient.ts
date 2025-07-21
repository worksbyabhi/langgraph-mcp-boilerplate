import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const getMcpClient = async (url: string): Promise<Client> => {
  const client = new Client({
    name: "streamable-http-client",
    version: "1.0.0",
  });

  try {
    const transport = new StreamableHTTPClientTransport(new URL(url));
    await client.connect(transport);
    console.log("Connected using Streamable HTTP transport");
    return client;
  } catch (err) {
    throw new Error(`Streamable HTTP connection failed. ${err}`);
  }
};
