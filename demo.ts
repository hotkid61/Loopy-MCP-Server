import { CatalogClient } from "./catalog-client.js";
import { LoopyTools } from "./loopy-tools.js";
import { LoopExecutor } from "./loop-executor.js";

/**
 * Loopy MCP Server Demo
 * Shows all available functionality
 */

async function main() {
  console.log("=== Loopy MCP Server Demo ===\n");

  const catalog = new CatalogClient();
  const tools = new LoopyTools(process.cwd());
  const executor = new LoopExecutor(process.cwd());

  try {
    // 1. Search loops
    console.log("1. Searching for test-related loops...");
    const searchResults = await catalog.searchLoops("testing", 3);
    console.log(`Found ${searchResults.length} loops:`);
    searchResults.forEach((loop) => {
      console.log(`  - ${loop.name}: ${loop.description}`);
    });
    console.log();

    // 2. Get recommendations
    console.log("2. Getting recommendations for: 'improve code quality'");
    const recommendations = await catalog.getRecommendations(
      "improve code quality"
    );
    console.log(`Recommendations:`);
    recommendations.forEach((loop) => {
      console.log(
        `  - ${loop.name} (Use when: ${loop.useWhen.substring(0, 50)}...)`
      );
    });
    console.log();

    // 3. Analyze a loop
    console.log("3. Analyzing a sample loop...");
    const sampleLoop =
      "Find the slowest endpoint. Make one optimization. Test performance. Keep improvement if it helps. Repeat until target met or no progress.";
    const analysis = tools.analyzeLoop(sampleLoop);
    console.log("Analysis:");
    console.log(`  Strengths: ${analysis.strengths.join(", ")}`);
    console.log(`  Weaknesses: ${analysis.weaknesses.join(", ")}`);
    console.log(`  Suggestions: ${analysis.suggestions.join(", ")}`);
    console.log();

    // 4. Craft loop questions
    console.log("4. Crafting a custom loop - Interview questions:");
    const craftQuestions = tools.generateCraftInterview();
    craftQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q}`);
    });
    console.log();

    // 5. List categories
    console.log("5. Available loop categories:");
    const categories = await catalog.getCategories();
    console.log(`  ${categories.join(", ")}`);
    console.log();

    // 6. Discover patterns
    console.log("6. Discovering repeated patterns in codebase...");
    const patterns = await tools.discoverPatterns();
    if (patterns.length > 0) {
      patterns.slice(0, 3).forEach((p) => console.log(`  - ${p}`));
    } else {
      console.log("  No repeated patterns found (or limited codebase)");
    }
    console.log();

    console.log("=== Demo Complete ===");
    console.log("\nTo start the MCP server, run: npm run server");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
