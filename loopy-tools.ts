import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * Loop Tools
 * Core Loopy functionality: discovery, crafting, and management
 */

export interface SavedLoop {
  name: string;
  description: string;
  prompt: string;
  savedAt: string;
  source?: string;
  sourceModifiedAt?: string;
}

export class LoopyTools {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load saved loops from project's LOOPS.md
   */
  loadProjectLoops(): SavedLoop[] {
    const loopsFile = path.join(this.projectRoot, "LOOPS.md");

    if (!fs.existsSync(loopsFile)) {
      return [];
    }

    const content = fs.readFileSync(loopsFile, "utf-8");
    const loops: SavedLoop[] = [];

    // Parse LOOPS.md format
    const sections = content.split(/^## /m);

    for (const section of sections) {
      const lines = section.split("\n");
      const name = lines[0].trim();

      if (!name) continue;

      let description = "";
      let prompt = "";
      let savedAt = new Date().toISOString();
      let source = "";

      let currentSection = "";

      for (const line of lines.slice(1)) {
        if (line.startsWith("### ")) {
          currentSection = line.replace("### ", "").trim();
        } else if (line.trim()) {
          if (currentSection === "Description") {
            description += line + "\n";
          } else if (currentSection === "Prompt") {
            prompt += line + "\n";
          } else if (line.includes("Saved:")) {
            savedAt = line.replace("Saved:", "").trim();
          } else if (line.includes("Source:")) {
            source = line.replace("Source:", "").trim();
          }
        }
      }

      if (name && prompt) {
        loops.push({
          name,
          description: description.trim(),
          prompt: prompt.trim(),
          savedAt,
          source: source || undefined,
        });
      }
    }

    return loops;
  }

  /**
   * Save a loop to project's LOOPS.md
   */
  saveLoopToProject(
    name: string,
    description: string,
    prompt: string,
    source?: string,
    sourceModifiedAt?: string
  ): void {
    const loopsFile = path.join(this.projectRoot, "LOOPS.md");
    const timestamp = new Date().toISOString();

    let content = "";
    if (fs.existsSync(loopsFile)) {
      content = fs.readFileSync(loopsFile, "utf-8");
    }

    const loopEntry = `## ${name}\n\n### Description\n${description}\n\n### Prompt\n\`\`\`\n${prompt}\n\`\`\`\n\n### Metadata\n- Saved: ${timestamp}\n${source ? `- Source: ${source}` : ""}\n${sourceModifiedAt ? `- Source Modified: ${sourceModifiedAt}` : ""}\n\n---\n\n`;

    fs.writeFileSync(loopsFile, loopEntry + content);
  }

  /**
   * Analyze codebase for repeated patterns
   */
  async discoverPatterns(): Promise<string[]> {
    const patterns: string[] = [];

    try {
      // Look for common patterns in common files
      const candidates = [
        ".github/workflows",
        "scripts",
        "src",
        "lib",
        "tests",
      ];

      for (const candidate of candidates) {
        const candidatePath = path.join(this.projectRoot, candidate);
        if (fs.existsSync(candidatePath)) {
          const files = this.getAllFiles(candidatePath);

          // Look for repeated patterns
          const fileContents = files.map((f) => ({
            path: f,
            content: fs.readFileSync(f, "utf-8"),
          }));

          // Simple pattern detection
          for (let i = 0; i < fileContents.length; i++) {
            for (let j = i + 1; j < fileContents.length; j++) {
              const similarity = this.calculateSimilarity(
                fileContents[i].content,
                fileContents[j].content
              );
              if (similarity > 0.7) {
                patterns.push(
                  `Repeated pattern in ${fileContents[i].path} and ${fileContents[j].path} (${Math.round(similarity * 100)}% similar)`
                );
              }
            }
          }
        }
      }

      return patterns;
    } catch (error) {
      console.error("Error discovering patterns:", error);
      return [];
    }
  }

  /**
   * Analyze a loop for weaknesses
   */
  analyzeLoop(loopPrompt: string): {
    weaknesses: string[];
    strengths: string[];
    suggestions: string[];
  } {
    const weaknesses: string[] = [];
    const strengths: string[] = [];
    const suggestions: string[] = [];

    const text = loopPrompt.toLowerCase();

    // Check for clear stopping conditions
    if (
      !text.includes("stop") &&
      !text.includes("until") &&
      !text.includes("while")
    ) {
      weaknesses.push("No clear stopping condition defined");
      suggestions.push(
        'Add "until [condition]" or "stop when [condition]" to define exit criteria'
      );
    } else {
      strengths.push("Clear stopping condition defined");
    }

    // Check for verification/check step
    if (
      !text.includes("check") &&
      !text.includes("verify") &&
      !text.includes("test")
    ) {
      weaknesses.push("No verification or check step");
      suggestions.push(
        "Add a step to verify that the work succeeded before continuing"
      );
    } else {
      strengths.push("Includes verification step");
    }

    // Check for feedback mechanism
    if (!text.includes("learn") && !text.includes("measure")) {
      suggestions.push("Consider adding measurement or feedback between passes");
    } else {
      strengths.push("Includes feedback mechanism");
    }

    // Check for bounded iteration
    if (
      !text.includes("maximum") &&
      !text.includes("up to") &&
      !text.includes("limit")
    ) {
      suggestions.push(
        "Consider setting a maximum number of iterations to prevent infinite loops"
      );
    }

    // Check for approval boundary
    if (
      !text.includes("approval") &&
      !text.includes("permission") &&
      !text.includes("ask")
    ) {
      suggestions.push(
        "Consider adding an approval boundary for high-impact actions"
      );
    }

    return { weaknesses, strengths, suggestions };
  }

  /**
   * Generate loop craft interview
   */
  generateCraftInterview(): string[] {
    return [
      "What are you trying to accomplish? (One clear goal)",
      "How will you know whether the work succeeded? (Acceptance criteria)",
      "What scope or resources are available? (Boundaries)",
      "What checks should run after each pass? (Verification)",
      "When should the loop stop? (Exit criteria)",
    ];
  }

  /**
   * Get all files in a directory recursively
   */
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.isDirectory() &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules"
        ) {
          files.push(...this.getAllFiles(fullPath));
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return files;
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const shorter = str1.length < str2.length ? str1 : str2;
    const longer = str1.length >= str2.length ? str1 : str2;

    const editDistance = this.levenshteinDistance(shorter, longer);
    return 1 - editDistance / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
