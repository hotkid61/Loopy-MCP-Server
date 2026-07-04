import * as readline from "readline";
import { CatalogClient, Loop } from "./catalog-client";
import { LoopyTools } from "./loopy-tools";
import { LoopExecutor, LoopReceipt } from "./loop-executor";

interface MCPRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: { code: number; message: string };
}

/**
 * Loopy MCP Server
 * Provides Loopy functionality to LM Studio and other MCP clients
 */
class LoopyMCPServer {
  private catalogClient: CatalogClient;
  private loopyTools: LoopyTools;
  private loopExecutor: LoopExecutor;

  constructor() {
    this.catalogClient = new CatalogClient();
    this.loopyTools = new LoopyTools(process.cwd());
    this.loopExecutor = new LoopExecutor(process.cwd());
  }

  /**
   * Handle MCP requests
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case "initialize":
          return this.handleInitialize(id);

        case "tools/list":
          return this.handleToolsList(id);

        case "tools/call":
          return this.handleToolCall(id, params);

        default:
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Unknown method: ${method}`,
            },
          };
      }
    } catch (error: any) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: error.message || "Internal server error",
        },
      };
    }
  }

  /**
   * Initialize server
   */
  private handleInitialize(id: number | string): MCPResponse {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
        serverInfo: {
          name: "Loopy MCP Server",
          version: "1.0.0",
          description:
            "MCP server providing Loopy loop library and tools for LM Studio",
        },
      },
    };
  }

  /**
   * List available tools
   */
  private handleToolsList(id: number | string): MCPResponse {
    const tools = [
      {
        name: "search_loops",
        description:
          "Search the Loop Library catalog for published loops by keyword",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search keywords (e.g., 'test', 'documentation')",
            },
            limit: {
              type: "number",
              description: "Max results to return (default: 5)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_loop_recommendations",
        description:
          "Get loop recommendations based on what you're trying to accomplish",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Describe what you want to accomplish",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "get_loop_details",
        description: "Get full details of a specific loop from the catalog",
        inputSchema: {
          type: "object",
          properties: {
            loop_id: {
              type: "string",
              description: "Loop ID or name",
            },
          },
          required: ["loop_id"],
        },
      },
      {
        name: "analyze_loop",
        description:
          "Audit a loop for weaknesses, check stopping conditions, and suggest improvements",
        inputSchema: {
          type: "object",
          properties: {
            loop_prompt: {
              type: "string",
              description: "The loop prompt/instructions to analyze",
            },
          },
          required: ["loop_prompt"],
        },
      },
      {
        name: "craft_loop",
        description:
          "Get interview questions to help craft a custom loop for your needs",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "save_loop",
        description: "Save a loop to the project's LOOPS.md file",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Loop name",
            },
            description: {
              type: "string",
              description: "One-sentence description",
            },
            prompt: {
              type: "string",
              description: "The loop prompt/instructions",
            },
            source: {
              type: "string",
              description: "Optional source URL if adapted from published loop",
            },
          },
          required: ["name", "description", "prompt"],
        },
      },
      {
        name: "load_project_loops",
        description: "Load loops saved in the project's LOOPS.md file",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "discover_patterns",
        description:
          "Analyze the codebase for repeated patterns that could become loops",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "run_loop",
        description: "Execute a loop with bounded passes and get a receipt",
        inputSchema: {
          type: "object",
          properties: {
            loop_prompt: {
              type: "string",
              description: "The loop prompt to execute",
            },
            max_passes: {
              type: "number",
              description: "Maximum number of passes (default: 10)",
            },
            loop_name: {
              type: "string",
              description: "Name of the loop for tracking",
            },
          },
          required: ["loop_prompt"],
        },
      },
      {
        name: "list_categories",
        description: "List all loop categories in the catalog",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];

    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools,
      },
    };
  }

  /**
   * Handle tool calls
   */
  private async handleToolCall(
    id: number | string,
    params: any
  ): Promise<MCPResponse> {
    const { name, arguments: toolArgs } = params;

    try {
      let result: any;

      switch (name) {
        case "search_loops":
          result = await this.catalogClient.searchLoops(
            toolArgs.query,
            toolArgs.limit || 5
          );
          break;

        case "get_loop_recommendations":
          result = await this.catalogClient.getRecommendations(toolArgs.task);
          break;

        case "get_loop_details":
          result = await this.catalogClient.getLoopById(toolArgs.loop_id);
          break;

        case "analyze_loop":
          result = this.loopyTools.analyzeLoop(toolArgs.loop_prompt);
          break;

        case "craft_loop":
          result = {
            questions: this.loopyTools.generateCraftInterview(),
            description:
              "Answer these questions to help create a custom loop for your needs",
          };
          break;

        case "save_loop":
          this.loopyTools.saveLoopToProject(
            toolArgs.name,
            toolArgs.description,
            toolArgs.prompt,
            toolArgs.source
          );
          result = {
            success: true,
            message: `Loop "${toolArgs.name}" saved to LOOPS.md`,
          };
          break;

        case "load_project_loops":
          result = this.loopyTools.loadProjectLoops();
          break;

        case "discover_patterns":
          result = await this.loopyTools.discoverPatterns();
          break;

        case "run_loop":
          const execution = await this.loopExecutor.executeLoop(
            toolArgs.loop_prompt,
            toolArgs.max_passes || 10
          );

          const receipt = this.loopExecutor.createReceipt(
            toolArgs.loop_name || "unnamed",
            toolArgs.loop_name || "Unnamed Loop",
            execution.actions.length,
            execution.actions.filter((a) => a.includes("successfully")).length,
            execution.actions.filter((a) => a.includes("No progress")).length,
            execution.stopReason,
            execution.actions,
            execution.evidence,
            execution.outcome
          );

          this.loopExecutor.saveReceipt(receipt);
          result = receipt;
          break;

        case "list_categories":
          result = await this.catalogClient.getCategories();
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error: any) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: error.message || `Error in tool: ${name}`,
        },
      };
    }
  }

  /**
   * Start the server
   */
  start(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    console.error("[Loopy MCP Server] Starting and listening for requests...");

    rl.on("line", async (line) => {
      if (!line.trim()) return;

      try {
        const request: MCPRequest = JSON.parse(line);
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + "\n");
      } catch (error: any) {
        const errorResponse: MCPResponse = {
          jsonrpc: "2.0",
          id: "unknown",
          error: {
            code: -32700,
            message: "Parse error",
          },
        };
        process.stdout.write(JSON.stringify(errorResponse) + "\n");
      }
    });

    rl.on("close", () => {
      console.error("[Loopy MCP Server] Connection closed");
      process.exit(0);
    });
  }
}

const server = new LoopyMCPServer();
server.start();
