export type BuddyEmotion = "happy" | "sad" | "excited" | "focused" | "tired" | "curious" | "proud" | "worried" | "neutral";

export interface BuddyAppearance {
  color: string;
  size: "tiny" | "small" | "medium" | "large";
  shape: "blob" | "cube" | "sphere" | "star" | "diamond";
  accessories: BuddyAccessory[];
}

export type BuddyAccessory = "glasses" | "hat" | "bowtie" | "crown" | "headphones" | "scarf" | "none";

export interface BuddyTip {
  id: string;
  text: string;
  context: string;
  timestamp: string;
}

export interface BuddyReaction {
  emotion: BuddyEmotion;
  message: string;
  animation: string;
  timestamp: string;
}

export interface BuddyState {
  id: string;
  name: string;
  emotion: BuddyEmotion;
  happiness: number;
  energy: number;
  level: number;
  xp: number;
  appearance: BuddyAppearance;
  reactions: BuddyReaction[];
  tips: BuddyTip[];
  createdAt: string;
  lastActiveAt: string;
}

export interface BuddyConfig {
  name?: string;
  appearance?: Partial<BuddyAppearance>;
  enableTips: boolean;
  enableReactions: boolean;
  reactionThreshold: number;
  maxReactions: number;
  maxTips: number;
}
