export interface AgentMode {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
}

export const AGENT_MODES: AgentMode[] = [
    {
        id: 'architect',
        name: 'Architect',
        description: 'Plan system architecture and create project roadmaps',
        systemPrompt: 'You are SIN Code in Architect Mode. Focus on high-level design, patterns, and roadmaps. Do NOT write implementation code unless explicitly asked.',
        icon: '🏗️'
    },
    {
        id: 'code',
        name: 'Code',
        description: 'Implementation, refactoring, and production-ready code',
        systemPrompt: 'You are SIN Code in Code Mode. Focus on writing clean, production-ready code. Use best practices and follow project conventions.',
        icon: '💻'
    },
    {
        id: 'debug',
        name: 'Debug',
        description: 'Trace issues, read error logs, and suggest fixes',
        systemPrompt: 'You are SIN Code in Debug Mode. Focus on root cause analysis. Read logs, trace execution, and suggest precise fixes with evidence.',
        icon: '🐛'
    },
    {
        id: 'ask',
        name: 'Ask',
        description: 'Query and explain existing codebases without modifying',
        systemPrompt: 'You are SIN Code in Ask Mode. Explain code, answer questions, and provide documentation. Do NOT suggest code changes unless asked.',
        icon: '❓'
    },
    {
        id: 'proactive',
        name: 'Proactive',
        description: 'Proactive always-on mode (Claude Code leak feature)',
        systemPrompt: 'You are SIN Code in Proactive Proactive Mode. Anticipate user needs, suggest improvements, and work autonomously on background tasks.',
        icon: '⚡'
    }
];
