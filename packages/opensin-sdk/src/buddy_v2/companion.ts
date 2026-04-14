import type { Companion, CompanionBones, Rarity, StatName } from './types'
import {
  EYES, HATS, RARITIES, RARITY_WEIGHTS, SPECIES, STAT_NAMES,
  XP_PER_LEVEL, MAX_LEVEL,
} from './types'

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!
}

function rollRarity(rng: () => number): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)
  let roll = rng() * total
  for (const rarity of RARITIES) {
    roll -= RARITY_WEIGHTS[rarity]
    if (roll < 0) return rarity
  }
  return 'common'
}

const RARITY_FLOOR: Record<Rarity, number> = {
  common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50,
}

function rollStats(rng: () => number, rarity: Rarity): Record<StatName, number> {
  const floor = RARITY_FLOOR[rarity]
  const peak = pick(rng, STAT_NAMES)
  let dump = pick(rng, STAT_NAMES)
  while (dump === peak) dump = pick(rng, STAT_NAMES)
  const stats = {} as Record<StatName, number>
  for (const name of STAT_NAMES) {
    if (name === peak) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
    else if (name === dump) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
    else stats[name] = floor + Math.floor(rng() * 40)
  }
  return stats
}

const SALT = 'opensin-companion-2026'

export type Roll = { bones: CompanionBones; inspirationSeed: number }

function rollFrom(rng: () => number): Roll {
  const rarity = rollRarity(rng)
  return {
    bones: {
      rarity, species: pick(rng, SPECIES), eye: pick(rng, EYES),
      hat: rarity === 'common' ? 'none' : pick(rng, HATS),
      shiny: rng() < 0.01, stats: rollStats(rng, rarity),
    },
    inspirationSeed: Math.floor(rng() * 1e9),
  }
}

let rollCache: { key: string; value: Roll } | undefined

export function roll(userId: string): Roll {
  const key = userId + SALT
  if (rollCache?.key === key) return rollCache.value
  const value = rollFrom(mulberry32(hashString(key)))
  rollCache = { key, value }
  return value
}

export function rollWithSeed(seed: string): Roll {
  return rollFrom(mulberry32(hashString(seed)))
}

export function getCompanionFromStored(
  stored: { name: string; personality: string; hatchedAt: number; xp: number; level: number; emotion: string } | undefined,
  userId: string,
): Companion | undefined {
  if (!stored) return undefined
  const { bones } = roll(userId)
  return { ...stored, ...bones, emotion: stored.emotion as Companion['emotion'] }
}

export function calculateLevel(xp: number): number {
  return Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1)
}

export function addXP(currentXP: number, amount: number): { xp: number; level: number; leveledUp: boolean } {
  const newXP = currentXP + amount
  const oldLevel = calculateLevel(currentXP)
  const newLevel = calculateLevel(newXP)
  return { xp: newXP, level: newLevel, leveledUp: newLevel > oldLevel }
}
