import {
  BuddyState,
  BuddyEmotion,
  BuddyAppearance,
  BuddyConfig,
  BuddyReaction,
  BuddyTip,
  BuddyAccessory,
} from "./types.js";

const DEFAULT_CONFIG: BuddyConfig = {
  enableTips: true,
  enableReactions: true,
  reactionThreshold: 0.3,
  maxReactions: 50,
  maxTips: 20,
};

const ENCOURAGEMENTS: Record<BuddyEmotion, string[]> = {
  happy: ["You're doing great!", "Keep up the awesome work!", "Code looks beautiful today!"],
  sad: ["Don't worry, we'll fix it together!", "Every bug is a learning opportunity!", "Take a breath, you've got this!"],
  excited: ["This is going to be amazing!", "I can feel the progress!", "Something great is happening!"],
  focused: ["Deep work mode activated!", "In the zone!", "Laser focus — love it!"],
  tired: ["Maybe a quick break would help?", "You've been working hard, proud of you!", "Remember to stretch!"],
  curious: ["Interesting approach!", "I wonder what happens if...", "Great question to explore!"],
  proud: ["Look how far we've come!", "That was brilliantly done!", "You should be proud of this!"],
  worried: ["Let's double-check this part", "I'm a bit nervous about this...", "Maybe we should test this carefully"],
  neutral: ["Ready when you are!", "Standing by!", "What's next?"],
};

const TIPS: string[] = [
  "Try breaking large functions into smaller ones for readability",
  "Don't forget to write tests for edge cases",
  "Consider adding error handling here",
  "A quick git commit might be a good idea",
  "Have you checked the recent changes in this file?",
  "Remember to update documentation when changing APIs",
  "Consider using a more descriptive variable name",
  "This might be a good candidate for extraction",
  "Try running the linter before committing",
  "A quick code review could catch issues early",
];

const ACCESSORIES: BuddyAccessory[] = ["glasses", "hat", "bowtie", "crown", "headphones", "scarf", "none"];
const COLORS = ["#7C3AED", "#2563EB", "#059669", "#D97706", "#DC2626", "#DB2777", "#6366F1", "#0891B2"];
const SHAPES: BuddyAppearance["shape"][] = ["blob", "cube", "sphere", "star", "diamond"];
const SIZES: BuddyAppearance["size"][] = ["tiny", "small", "medium", "large"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return `buddy_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateAppearance(partial?: Partial<BuddyAppearance>): BuddyAppearance {
  return {
    color: partial?.color ?? randomFrom(COLORS),
    size: partial?.size ?? randomFrom(SIZES),
    shape: partial?.shape ?? randomFrom(SHAPES),
    accessories: partial?.accessories ?? [randomFrom(ACCESSORIES)],
  };
}

export class BuddyEngine {
  private state: BuddyState;
  private config: BuddyConfig;
  private listeners: Array<(state: BuddyState) => void> = [];

  constructor(config: Partial<BuddyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.hatch(config.name);
  }

  getState(): BuddyState {
    return { ...this.state };
  }

  getConfig(): BuddyConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<BuddyConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.appearance) {
      this.state.appearance = { ...this.state.appearance, ...config.appearance };
    }
    this.notify();
  }

  reactToSuccess(): void {
    if (!this.config.enableReactions) return;
    this.state.emotion = "happy";
    this.state.happiness = Math.min(100, this.state.happiness + 15);
    this.state.xp += 10;
    this.checkLevelUp();
    this.addReaction("happy", randomFrom(ENCOURAGEMENTS.happy), "bounce");
    this.notify();
  }

  reactToError(): void {
    if (!this.config.enableReactions) return;
    this.state.emotion = "sad";
    this.state.happiness = Math.max(0, this.state.happiness - 10);
    this.addReaction("sad", randomFrom(ENCOURAGEMENTS.sad), "droop");
    this.notify();
  }

  reactToCodingActivity(activity: "typing" | "building" | "testing" | "debugging" | "committing"): void {
    if (!this.config.enableReactions) return;
    switch (activity) {
      case "typing":
        this.state.emotion = "focused";
        this.state.energy = Math.max(0, this.state.energy - 2);
        this.addReaction("focused", randomFrom(ENCOURAGEMENTS.focused), "pulse");
        break;
      case "building":
        this.state.emotion = "excited";
        this.state.xp += 5;
        this.addReaction("excited", randomFrom(ENCOURAGEMENTS.excited), "spin");
        break;
      case "testing":
        this.state.emotion = "curious";
        this.state.xp += 3;
        this.addReaction("curious", randomFrom(ENCOURAGEMENTS.curious), "tilt");
        break;
      case "debugging":
        this.state.emotion = "worried";
        this.state.energy = Math.max(0, this.state.energy - 5);
        this.addReaction("worried", randomFrom(ENCOURAGEMENTS.worried), "shake");
        break;
      case "committing":
        this.state.emotion = "proud";
        this.state.xp += 8;
        this.state.happiness = Math.min(100, this.state.happiness + 5);
        this.checkLevelUp();
        this.addReaction("proud", randomFrom(ENCOURAGEMENTS.proud), "celebrate");
        break;
    }
    this.state.lastActiveAt = new Date().toISOString();
    this.notify();
  }

  getTip(): BuddyTip | null {
    if (!this.config.enableTips) return null;
    const tipText = randomFrom(TIPS);
    const tip: BuddyTip = {
      id: generateId(),
      text: tipText,
      context: this.state.emotion,
      timestamp: new Date().toISOString(),
    };
    this.state.tips.push(tip);
    if (this.state.tips.length > this.config.maxTips) {
      this.state.tips = this.state.tips.slice(-this.config.maxTips);
    }
    return tip;
  }

  customizeAppearance(appearance: Partial<BuddyAppearance>): void {
    this.state.appearance = { ...this.state.appearance, ...appearance };
    this.notify();
  }

  addAccessory(accessory: BuddyAccessory): void {
    if (!this.state.appearance.accessories.includes(accessory)) {
      this.state.appearance.accessories.push(accessory);
    }
    this.notify();
  }

  removeAccessory(accessory: BuddyAccessory): void {
    this.state.appearance.accessories = this.state.appearance.accessories.filter((a) => a !== accessory);
    this.notify();
  }

  rest(): void {
    this.state.energy = Math.min(100, this.state.energy + 30);
    this.state.emotion = "neutral";
    this.addReaction("neutral", "Feeling refreshed!", "stretch");
    this.notify();
  }

  subscribe(listener: (state: BuddyState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private hatch(name?: string): BuddyState {
    const buddyName = name ?? this.generateName();
    return {
      id: generateId(),
      name: buddyName,
      emotion: "happy",
      happiness: 70,
      energy: 100,
      level: 1,
      xp: 0,
      appearance: generateAppearance(this.config.appearance),
      reactions: [],
      tips: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
  }

  private addReaction(emotion: BuddyEmotion, message: string, animation: string): void {
    const reaction: BuddyReaction = {
      emotion,
      message,
      animation,
      timestamp: new Date().toISOString(),
    };
    this.state.reactions.push(reaction);
    if (this.state.reactions.length > this.config.maxReactions) {
      this.state.reactions = this.state.reactions.slice(-this.config.maxReactions);
    }
  }

  private checkLevelUp(): void {
    const xpForNextLevel = this.state.level * 50;
    if (this.state.xp >= xpForNextLevel) {
      this.state.level += 1;
      this.state.xp -= xpForNextLevel;
      this.addReaction("excited", `Level up! Now level ${this.state.level}!`, "levelup");
    }
  }

  private generateName(): string {
    const prefixes = ["Bit", "Byte", "Pixel", "Dot", "Spark", "Glim", "Bloop", "Zap", "Fizz", "Nim"];
    const suffixes = ["let", "ling", "bug", "bot", "kin", "pup", "ling", "ster", "o", "i"];
    return randomFrom(prefixes) + randomFrom(suffixes);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }
}
