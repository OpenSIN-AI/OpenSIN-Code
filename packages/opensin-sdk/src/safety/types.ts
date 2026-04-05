export interface SafetyCheck {
  isDestructive: boolean
  risk: 'none' | 'low' | 'medium' | 'high' | 'critical'
  reason: string
  suggestions?: string[]
}
