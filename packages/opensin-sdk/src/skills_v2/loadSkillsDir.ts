import type { Skill, SkillDirectory } from './types'
import { getBundledSkills } from './bundledSkills'

export async function loadSkillsFromDirectory(dirPath: string): Promise<SkillDirectory> {
  const skills: Skill[] = []; const now = Date.now()
  try {
    const fs = await import('fs'); const path = await import('path')
    if (!fs.existsSync(dirPath)) return { path: dirPath, skills: [], lastScanned: now }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(dirPath, entry.name); const skillFile = path.join(skillPath, 'skill.json')
        if (fs.existsSync(skillFile)) {
          try {
            const sd = JSON.parse(fs.readFileSync(skillFile, 'utf-8'))
            skills.push({ name: sd.name || entry.name, description: sd.description || '', version: sd.version || '1.0.0', category: sd.category || 'user', instructions: sd.instructions || '', triggers: sd.triggers || [], metadata: sd.metadata, source: 'user', enabled: sd.enabled !== false, usageCount: sd.usageCount || 0, lastUsed: sd.lastUsed, rating: sd.rating })
          } catch { /* skip invalid */ }
        }
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.skill')) {
        const content = fs.readFileSync(path.join(dirPath, entry.name), 'utf-8'); const name = path.basename(entry.name, path.extname(entry.name))
        skills.push({ name, description: `User skill: ${name}`, version: '1.0.0', category: 'user', instructions: content, triggers: [name.toLowerCase()], source: 'user', enabled: true, usageCount: 0 })
      }
    }
  } catch { /* directory loading failed */ }
  return { path: dirPath, skills, lastScanned: now }
}

export async function loadAllSkills(userSkillsDir?: string): Promise<Skill[]> {
  const bundled = getBundledSkills(); const userSkills: Skill[] = []
  if (userSkillsDir) { const dir = await loadSkillsFromDirectory(userSkillsDir); userSkills.push(...dir.skills) }
  return [...bundled, ...userSkills]
}

export function matchSkill(input: string, skills: Skill[]): { skill: Skill | null; confidence: number } {
  const lowerInput = input.toLowerCase(); let bestMatch: Skill | null = null; let bestConfidence = 0
  for (const skill of skills) {
    if (!skill.enabled) continue
    for (const trigger of skill.triggers) {
      const lt = trigger.toLowerCase()
      if (lowerInput.includes(lt)) { const c = lt.length / lowerInput.length; if (c > bestConfidence) { bestConfidence = c; bestMatch = skill } }
    }
  }
  return { skill: bestMatch, confidence: bestConfidence }
}
