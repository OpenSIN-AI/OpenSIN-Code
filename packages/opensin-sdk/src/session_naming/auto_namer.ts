import { AutoNameRequest } from "./types.js";

export class AutoNamer {
  async generateName(request: AutoNameRequest): Promise<string> {
    const { planContent } = request;
    if (!planContent || planContent.trim().length === 0) {
      return "Untitled Session";
    }

    const lines = planContent.split("\n").filter((line) => line.trim().length > 0);

    const titleLine = lines.find((line) => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith("#") ||
        trimmed.startsWith("##") ||
        trimmed.startsWith("Plan:") ||
        trimmed.startsWith("Task:")
      );
    });

    if (titleLine) {
      let name = titleLine.replace(/^#+\s*/, "").replace(/^(Plan|Task):\s*/i, "").trim();
      if (name.length > 50) {
        name = name.slice(0, 47).trim() + "…";
      }
      return name || "Untitled Session";
    }

    const firstLine = lines[0]?.trim();
    if (firstLine) {
      const words = firstLine.split(/\s+/).slice(0, 6).join(" ");
      return words.length > 50 ? words.slice(0, 47).trim() + "…" : words;
    }

    return "Untitled Session";
  }

  async nameFromPlan(request: AutoNameRequest): Promise<string> {
    return this.generateName(request);
  }
}
