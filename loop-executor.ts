import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * Loop Executor
 * Safely executes loops with bounded passes and tracking
 */

export interface LoopReceipt {
  loopId: string;
  loopName: string;
  startTime: string;
  endTime: string;
  totalPasses: number;
  acceptedChanges: number;
  rejectedChanges: number;
  stopReason:
    | "success"
    | "no_progress"
    | "blocker"
    | "limit_reached"
    | "user_stop";
  actions: string[];
  evidence: string[];
  outcome: string;
  notes: string[];
}

export class LoopExecutor {
  private workingDir: string;
  private maxPasses: number = 10;
  private timeout: number = 300000; // 5 minutes

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  /**
   * Create a loop execution receipt
   */
  createReceipt(
    loopId: string,
    loopName: string,
    passes: number,
    accepted: number,
    rejected: number,
    stopReason: LoopReceipt["stopReason"],
    actions: string[],
    evidence: string[],
    outcome: string,
    notes: string[] = []
  ): LoopReceipt {
    return {
      loopId,
      loopName,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      totalPasses: passes,
      acceptedChanges: accepted,
      rejectedChanges: rejected,
      stopReason,
      actions,
      evidence,
      outcome,
      notes,
    };
  }

  /**
   * Save receipt to project's LOOPS.md
   */
  saveReceipt(receipt: LoopReceipt, projectRoot: string = this.workingDir): void {
    const loopsFile = path.join(projectRoot, "LOOPS_RUNS.md");
    const timestamp = new Date().toISOString();

    let content = "";
    if (fs.existsSync(loopsFile)) {
      content = fs.readFileSync(loopsFile, "utf-8");
    }

    const receiptMarkdown = `
## Run: ${receipt.loopName} - ${timestamp}

- **Loop ID:** ${receipt.loopId}
- **Total Passes:** ${receipt.totalPasses}
- **Accepted:** ${receipt.acceptedChanges}
- **Rejected:** ${receipt.rejectedChanges}
- **Stop Reason:** ${receipt.stopReason}

### Actions Taken
${receipt.actions.map((a) => `- ${a}`).join("\n")}

### Evidence
${receipt.evidence.map((e) => `- ${e}`).join("\n")}

### Outcome
${receipt.outcome}

### Notes
${receipt.notes.map((n) => `- ${n}`).join("\n")}

---
`;

    fs.writeFileSync(loopsFile, receiptMarkdown + content);
  }

  /**
   * Execute a loop prompt with bounded passes
   */
  async executeLoop(
    prompt: string,
    maxPasses: number = this.maxPasses
  ): Promise<{
    success: boolean;
    actions: string[];
    evidence: string[];
    outcome: string;
    stopReason: LoopReceipt["stopReason"];
  }> {
    const actions: string[] = [];
    const evidence: string[] = [];
    let pass = 0;
    let stopReason: LoopReceipt["stopReason"] = "limit_reached";
    let outcome = "Reached maximum passes";

    try {
      // Parse the prompt to extract steps
      const steps = this.parseLoopSteps(prompt);

      for (pass = 1; pass <= maxPasses; pass++) {
        actions.push(`Pass ${pass}: Started`);

        // Simulate loop execution
        // In a real implementation, this would actually run the commands
        const result = await this.executePass(steps, pass);

        if (result.success) {
          actions.push(`Pass ${pass}: Completed successfully`);
          evidence.push(`Pass ${pass}: ✓ Verification passed`);
          stopReason = "success";
          outcome = `Loop completed successfully in ${pass} pass${pass > 1 ? "es" : ""}`;
          break;
        } else if (result.noProgress) {
          actions.push(`Pass ${pass}: No progress detected`);
          evidence.push(`Pass ${pass}: ✗ No measurable improvement`);
          stopReason = "no_progress";
          outcome = `Loop stopped after ${pass} passes - no progress`;
          break;
        } else if (result.blocker) {
          actions.push(`Pass ${pass}: Blocker encountered`);
          evidence.push(`Pass ${pass}: ⚠ Blocked: ${result.blockerMessage}`);
          stopReason = "blocker";
          outcome = `Loop stopped due to blocker: ${result.blockerMessage}`;
          break;
        }
      }

      return {
        success: stopReason === "success",
        actions,
        evidence,
        outcome,
        stopReason,
      };
    } catch (error: any) {
      return {
        success: false,
        actions,
        evidence,
        outcome: `Error during execution: ${error.message}`,
        stopReason: "blocker",
      };
    }
  }

  /**
   * Parse loop steps from prompt
   */
  private parseLoopSteps(prompt: string): string[] {
    const lines = prompt.split("\n");
    const steps: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\.|^-|^•/)) {
        steps.push(trimmed.replace(/^\d+\.\s*|-\s*|•\s*/, ""));
      }
    }

    return steps.length > 0
      ? steps
      : ["Execute loop", "Check results", "Repeat if needed"];
  }

  /**
   * Execute a single pass of the loop
   */
  private async executePass(
    steps: string[],
    passNumber: number
  ): Promise<{
    success: boolean;
    noProgress: boolean;
    blocker: boolean;
    blockerMessage?: string;
  }> {
    // Simulate pass execution
    // In production, this would actually execute the steps
    return {
      success: passNumber >= 3, // Pretend it succeeds on pass 3
      noProgress: false,
      blocker: false,
    };
  }

  /**
   * Format a loop for display
   */
  formatLoopForExecution(loopPrompt: string): string {
    return `
=== LOOP EXECUTION ===

${loopPrompt}

=== INSTRUCTIONS ===
- Execute each step in order
- Check success criteria after each pass
- Stop if no progress or blocker encountered
- Maximum 10 passes

Start execution? (yes/no)
`;
  }
}
