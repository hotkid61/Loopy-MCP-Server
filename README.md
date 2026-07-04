# Loopy MCP Server

A Model Context Protocol (MCP) server that brings **Loopy** functionality to LM Studio and other MCP-compatible clients.

## What is Loopy?

Loopy is a library of practical AI-agent loops and tools for discovering, adapting, crafting, and running repeatable agent workflows. A loop is a bounded, feedback-driven workflow that helps agents learn from results and take the next useful step.

**From Forward Future:** https://signals.forwardfuture.com/loop-library/

## Why Loopy MCP Server?

LM Studio doesn't have a skill system (yet), so this MCP server bridges the gap by exposing Loopy's core functionality through the MCP protocol. Now you can use Loopy directly in LM Studio to:

- Search and discover published loops from the Loop Library
- Get recommendations for your specific tasks
- Analyze loops for weaknesses and improvements
- Craft new custom loops through guided questions
- Save loops to your project for reuse
- Discover repeated patterns in your codebase
- Execute loops with bounded passes and track results

## Features

✅ **Search the Loop Library** - Find published loops by keyword  
✅ **Get Recommendations** - Discover loops for your specific task  
✅ **Analyze Loops** - Audit for weaknesses, stopping conditions, verification  
✅ **Craft Loops** - Interactive questions to design custom loops  
✅ **Save Loops** - Store loops in project's LOOPS.md  
✅ **Load Project Loops** - Reuse saved loops  
✅ **Discover Patterns** - Find repeated patterns in your codebase  
✅ **Run Loops** - Execute with bounded passes and get receipts  
✅ **Live Catalog** - Connects to the latest Loop Library  

## Installation

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

```bash
git clone https://github.com/hotkid61/Loopy-MCP-Server.git
cd Loopy-MCP-Server
npm install
```

## Usage

### Start the Server

```bash
npm run server
```

The server will start listening for JSON-RPC requests on stdin/stdout.

### For LM Studio

Add this to your LM Studio MCP configuration:

```json
{
  "mcpServers": {
    "loopy": {
      "command": "npm",
      "args": [
        "--prefix",
        "/path/to/Loopy-MCP-Server",
        "run",
        "server"
      ]
    }
  }
}
```

Replace `/path/to/Loopy-MCP-Server` with your actual installation path.

## Available Tools

### search_loops
Search the Loop Library catalog for loops by keyword

```
query: string (required) - Search keywords
limit: number (optional) - Max results (default: 5)
```

### get_loop_recommendations
Get loop recommendations based on your task

```
task: string (required) - Describe what you want to accomplish
```

### get_loop_details
Get full details of a specific loop

```
loop_id: string (required) - Loop ID or name
```

### analyze_loop
Audit a loop for weaknesses and get suggestions

```
loop_prompt: string (required) - The loop instructions to analyze
```

### craft_loop
Get interview questions to help design a custom loop

### save_loop
Save a loop to your project's LOOPS.md

```
name: string (required) - Loop name
description: string (required) - One-sentence description
prompt: string (required) - The loop instructions
source: string (optional) - Source URL if adapted from published loop
```

### load_project_loops
Load all loops saved in your project's LOOPS.md

### discover_patterns
Analyze your codebase for repeated patterns

### run_loop
Execute a loop with bounded passes

```
loop_prompt: string (required) - The loop to execute
max_passes: number (optional) - Max passes (default: 10)
loop_name: string (optional) - Loop name for tracking
```

### list_categories
List all categories in the Loop Library

## File Structure

```
Loopy-MCP-Server/
├── loopy-mcp-server.ts    # Main MCP server
├── catalog-client.ts      # Loop Library catalog integration
├── loopy-tools.ts         # Core Loopy functionality
├── loop-executor.ts       # Loop execution and tracking
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Examples

### Find a loop for your task
**Request:** "Find a loop for improving test coverage"
- Searches the catalog
- Returns top 3 recommendations
- Shows use cases, prompts, verification steps

### Analyze an existing loop
**Request:** "Audit this loop and suggest improvements: [paste loop]"
- Checks for clear stopping conditions
- Verifies acceptance criteria
- Identifies gaps
- Suggests improvements

### Save and reuse project loops
**Request:** "Save this loop to the project"
- Saves to LOOPS.md
- Available in future sessions
- Can be exported to Loop Library

### Run a loop with tracking
**Request:** "Run the Improve Test Coverage loop in this project"
- Executes in bounded passes
- Tracks actions and evidence
- Provides receipt with outcome
- Suggests improvements via debrief

## How Loops Work

A good loop answers four questions:

1. **What are you trying to accomplish?** - Clear goal
2. **How will you know it worked?** - Acceptance criteria
3. **What should you do with what you learn?** - Feedback cycle
4. **When should you stop?** - Exit condition

Example:

> Find the slowest page, make one focused improvement, and measure again. Keep the change only if it helps. Repeat until every page meets the target or another pass stops producing improvement.

## Integration with Forward Future

This server connects to the official **Loop Library** maintained by Forward Future:

- **Catalog:** https://signals.forwardfuture.com/loop-library/
- **Repository:** https://github.com/Forward-Future/loopy
- **License:** MIT

Loops are published with quality checks and can be submitted to the catalog from your project.

## Features in Detail

### Loop Discovery
Analyzes your codebase for repeated engineering patterns and turns strong candidates into bounded loops.

### Loop Adaptation
Takes a published loop and tailors it to your tools, limits, schedule, and definition of success.

### Loop Execution
Runs loops in bounded passes, applies acceptance checks, and returns evidence-backed receipts.

### Loop Debrief
Analyzes run results and recommends the smallest justified improvement.

### Publication
Validates, checks catalog overlap, and prepares loops for publication in Loop Library.

## Notes

- Catalogs are cached for 1 hour to reduce network requests
- Loop execution is simulated in basic mode (can be extended with real execution)
- LOOPS.md stores project-local loops for reuse
- LOOPS_RUNS.md tracks execution receipts for analysis
- All operations are non-destructive unless explicitly requested

## License

MIT

## Built With

- TypeScript
- Node.js
- MCP Protocol
- Loop Library (Forward Future)

## Support

For issues with Loopy itself: https://github.com/Forward-Future/loopy
For MCP server issues: Create an issue in this repository

---

**Ready to bring Loopy to LM Studio!** 🚀
