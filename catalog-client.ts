import * as fs from "fs";
import * as path from "path";

/**
 * Loop Catalog Client
 * Fetches and searches the published Loop Library catalog
 */

export interface Loop {
  id: string;
  name: string;
  description: string;
  useWhen: string;
  prompt: string;
  verify: string;
  steps: string[];
  notes?: string;
  relatedLoops?: string[];
  author?: string;
  publishedAt?: string;
  category?: string;
}

export class CatalogClient {
  private catalogUrl =
    "https://signals.forwardfuture.com/loop-library/catalog.json";
  private cachedCatalog: Loop[] | null = null;
  private cacheExpiry: number = 0;
  private cacheTTL: number = 1000 * 60 * 60; // 1 hour

  /**
   * Fetch the live catalog from Loop Library
   */
  async fetchCatalog(): Promise<Loop[]> {
    // Check cache
    if (this.cachedCatalog && Date.now() < this.cacheExpiry) {
      return this.cachedCatalog;
    }

    try {
      const response = await fetch(this.catalogUrl, {
        headers: {
          "User-Agent": "loopy-mcp-server/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch catalog: ${response.statusText}`);
      }

      const data = await response.json();
      this.cachedCatalog = Array.isArray(data) ? data : data.loops || [];
      this.cacheExpiry = Date.now() + this.cacheTTL;

      return this.cachedCatalog;
    } catch (error) {
      console.error("Error fetching catalog:", error);
      return this.getFallbackLoops();
    }
  }

  /**
   * Search loops by keyword
   */
  async searchLoops(query: string, limit: number = 5): Promise<Loop[]> {
    const catalog = await this.fetchCatalog();
    const queryLower = query.toLowerCase();

    return catalog
      .filter(
        (loop) =>
          loop.name.toLowerCase().includes(queryLower) ||
          loop.description.toLowerCase().includes(queryLower) ||
          loop.useWhen.toLowerCase().includes(queryLower) ||
          (loop.category && loop.category.toLowerCase().includes(queryLower))
      )
      .slice(0, limit);
  }

  /**
   * Get loop recommendations based on task description
   */
  async getRecommendations(taskDescription: string): Promise<Loop[]> {
    const keywords = taskDescription
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const catalog = await this.fetchCatalog();
    const scored = catalog.map((loop) => {
      let score = 0;

      for (const keyword of keywords) {
        if (loop.name.toLowerCase().includes(keyword)) score += 3;
        if (loop.description.toLowerCase().includes(keyword)) score += 2;
        if (loop.useWhen.toLowerCase().includes(keyword)) score += 2;
      }

      return { loop, score };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.loop);
  }

  /**
   * Get a specific loop by ID or name
   */
  async getLoopById(id: string): Promise<Loop | null> {
    const catalog = await this.fetchCatalog();
    return (
      catalog.find(
        (loop) =>
          loop.id === id || loop.name.toLowerCase() === id.toLowerCase()
      ) || null
    );
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const catalog = await this.fetchCatalog();
    const categories = new Set<string>();

    for (const loop of catalog) {
      if (loop.category) {
        categories.add(loop.category);
      }
    }

    return Array.from(categories).sort();
  }

  /**
   * Fallback loops if catalog fetch fails
   */
  private getFallbackLoops(): Loop[] {
    return [
      {
        id: "improve-test-coverage",
        name: "Improve Test Coverage",
        description:
          "Find untested code and add focused tests until coverage meets your target.",
        useWhen: "Your test coverage is below your project target",
        prompt:
          "Analyze the codebase for untested code paths. Add one focused test for the most important gap. Measure coverage. Repeat until coverage meets the target or no more progress.",
        verify: "Test coverage report shows target met",
        steps: [
          "Find untested code paths",
          "Write focused test for largest gap",
          "Run tests and measure coverage",
          "Keep test if it improves coverage",
          "Repeat until target reached",
        ],
        category: "testing",
      },
      {
        id: "fix-failing-tests",
        name: "Fix Failing Tests",
        description: "Fix failing tests one at a time with verification.",
        useWhen: "Your test suite has failures",
        prompt:
          "Find a failing test. Read its code and fix the root cause. Run the test again. Keep the change if it passes. Repeat for each failing test.",
        verify: "All tests pass",
        steps: [
          "List failing tests",
          "Pick one test",
          "Analyze and fix the cause",
          "Run test",
          "Repeat for next failure",
        ],
        category: "testing",
      },
      {
        id: "improve-documentation",
        name: "Improve Documentation",
        description:
          "Make documentation complete and clear without changing code.",
        useWhen: "Documentation is incomplete or unclear",
        prompt:
          "Find unclear or missing documentation. Update one section: add examples, clarify steps, or fix outdated info. Verify it matches the code. Repeat for the next gap.",
        verify: "Documentation is clear and current",
        steps: [
          "Find unclear documentation",
          "Update and improve",
          "Verify accuracy",
          "Repeat",
        ],
        category: "documentation",
      },
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedCatalog = null;
    this.cacheExpiry = 0;
  }
}
