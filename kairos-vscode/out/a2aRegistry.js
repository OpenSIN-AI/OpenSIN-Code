"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadA2ARegistry = void 0;
const A2A_REGISTRY = {
  "agent_001": {
    "id": "agent_001",
    "repo": "OpenSIN-AI/A2A-SIN-Discord",
    "name": "Discord",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-discord.hf.space",
    "capabilities": [
      "discord",
      "chat",
      "moderation",
      "webhooks"
    ],
    "status": "unknown"
  },
  "agent_002": {
    "id": "agent_002",
    "repo": "OpenSIN-AI/A2A-SIN-Instagram",
    "name": "Instagram",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-instagram.hf.space",
    "capabilities": [
      "instagram",
      "posting",
      "analytics",
      "stories"
    ],
    "status": "unknown"
  },
  "agent_003": {
    "id": "agent_003",
    "repo": "OpenSIN-AI/A2A-SIN-LinkedIn",
    "name": "LinkedIn",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-linkedin.hf.space",
    "capabilities": [
      "linkedin",
      "networking",
      "content",
      "messaging"
    ],
    "status": "unknown"
  },
  "agent_004": {
    "id": "agent_004",
    "repo": "OpenSIN-AI/A2A-SIN-Medium",
    "name": "Medium",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-medium.hf.space",
    "capabilities": [
      "medium",
      "blogging",
      "content",
      "publishing"
    ],
    "status": "unknown"
  },
  "agent_005": {
    "id": "agent_005",
    "repo": "OpenSIN-AI/A2A-SIN-Reddit",
    "name": "Reddit",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-reddit.hf.space",
    "capabilities": [
      "reddit",
      "posting",
      "monitoring",
      "scraping"
    ],
    "status": "unknown"
  },
  "agent_006": {
    "id": "agent_006",
    "repo": "OpenSIN-AI/A2A-SIN-TikTok",
    "name": "TikTok",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-tiktok.hf.space",
    "capabilities": [
      "tiktok",
      "video",
      "trends",
      "analytics"
    ],
    "status": "unknown"
  },
  "agent_007": {
    "id": "agent_007",
    "repo": "OpenSIN-AI/A2A-SIN-ClaimWriter",
    "name": "ClaimWriter",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-claimwriter.hf.space",
    "capabilities": [
      "claims",
      "writing",
      "legal"
    ],
    "status": "unknown"
  },
  "agent_008": {
    "id": "agent_008",
    "repo": "OpenSIN-AI/A2A-SIN-X-Twitter",
    "name": "X Twitter",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-x-twitter.hf.space",
    "capabilities": [
      "twitter",
      "posting",
      "engagement",
      "threads"
    ],
    "status": "unknown"
  },
  "agent_009": {
    "id": "agent_009",
    "repo": "OpenSIN-AI/A2A-SIN-Youtube",
    "name": "YouTube",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-youtube.hf.space",
    "capabilities": [
      "youtube",
      "video",
      "analytics",
      "seo"
    ],
    "status": "unknown"
  },
  "agent_010": {
    "id": "agent_010",
    "repo": "OpenSIN-AI/A2A-SIN-Telegram",
    "name": "Telegram",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-telegram.hf.space",
    "capabilities": [
      "telegram",
      "chat",
      "bots",
      "broadcast"
    ],
    "status": "unknown"
  },
  "agent_011": {
    "id": "agent_011",
    "repo": "OpenSIN-AI/A2A-SIN-HackerNews",
    "name": "HackerNews",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-hackernews.hf.space",
    "capabilities": [
      "hackernews",
      "posting",
      "monitoring"
    ],
    "status": "unknown"
  },
  "agent_012": {
    "id": "agent_012",
    "repo": "OpenSIN-AI/A2A-SIN-ProductHunt",
    "name": "ProductHunt",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-producthunt.hf.space",
    "capabilities": [
      "producthunt",
      "launches",
      "marketing"
    ],
    "status": "unknown"
  },
  "agent_013": {
    "id": "agent_013",
    "repo": "OpenSIN-AI/A2A-SIN-DevTo",
    "name": "DevTo",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-devto.hf.space",
    "capabilities": [
      "devto",
      "blogging",
      "code"
    ],
    "status": "unknown"
  },
  "agent_014": {
    "id": "agent_014",
    "repo": "OpenSIN-AI/A2A-SIN-Quora",
    "name": "Quora",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-quora.hf.space",
    "capabilities": [
      "quora",
      "answers",
      "knowledge"
    ],
    "status": "unknown"
  },
  "agent_015": {
    "id": "agent_015",
    "repo": "OpenSIN-AI/A2A-SIN-Summary",
    "name": "Summary",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-summary.hf.space",
    "capabilities": [
      "summary",
      "aggregation",
      "analysis"
    ],
    "status": "unknown"
  },
  "agent_016": {
    "id": "agent_016",
    "repo": "OpenSIN-AI/A2A-SIN-Team-Marketing",
    "name": "Team Marketing",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-team-marketing.hf.space",
    "capabilities": [
      "marketing",
      "campaigns",
      "seo"
    ],
    "status": "unknown"
  },
  "agent_017": {
    "id": "agent_017",
    "repo": "OpenSIN-AI/A2A-SIN-Research",
    "name": "Research",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-research.hf.space",
    "capabilities": [
      "research",
      "analysis",
      "reports"
    ],
    "status": "unknown"
  },
  "agent_018": {
    "id": "agent_018",
    "repo": "OpenSIN-AI/A2A-SIN-IndieHackers",
    "name": "IndieHackers",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-indiehackers.hf.space",
    "capabilities": [
      "indiehackers",
      "building",
      "milestones"
    ],
    "status": "unknown"
  },
  "agent_019": {
    "id": "agent_019",
    "repo": "OpenSIN-AI/A2A-SIN-Lobsters",
    "name": "Lobsters",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-lobsters.hf.space",
    "capabilities": [
      "lobsters",
      "posting",
      "tech"
    ],
    "status": "unknown"
  },
  "agent_020": {
    "id": "agent_020",
    "repo": "OpenSIN-AI/A2A-SIN-Slashdot",
    "name": "Slashdot",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-slashdot.hf.space",
    "capabilities": [
      "slashdot",
      "news",
      "commentary"
    ],
    "status": "unknown"
  },
  "agent_021": {
    "id": "agent_021",
    "repo": "OpenSIN-AI/A2A-SIN-StackOverflow",
    "name": "StackOverflow",
    "category": "Social Media",
    "hostType": "hf",
    "host": "https://a2a-sin-stackoverflow.hf.space",
    "capabilities": [
      "stackoverflow",
      "answers",
      "coding"
    ],
    "status": "unknown"
  },
  "agent_022": {
    "id": "agent_022",
    "repo": "OpenSIN-AI/sin-code-ai",
    "name": "Code AI",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "coding",
      "ai",
      "generation",
      "refactoring"
    ],
    "status": "unknown"
  },
  "agent_023": {
    "id": "agent_023",
    "repo": "OpenSIN-AI/sin-code-database",
    "name": "Code Database",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "database",
      "sql",
      "orm",
      "migration"
    ],
    "status": "unknown"
  },
  "agent_024": {
    "id": "agent_024",
    "repo": "OpenSIN-AI/sin-code-datascience",
    "name": "Code Datascience",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "datascience",
      "ml",
      "analysis",
      "notebooks"
    ],
    "status": "unknown"
  },
  "agent_025": {
    "id": "agent_025",
    "repo": "OpenSIN-AI/sin-code-devops",
    "name": "Code Devops",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "devops",
      "ci-cd",
      "infrastructure",
      "deploy"
    ],
    "status": "unknown"
  },
  "agent_026": {
    "id": "agent_026",
    "repo": "OpenSIN-AI/sin-code-integration",
    "name": "Code Integration",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "integration",
      "api",
      "webhook",
      "sync"
    ],
    "status": "unknown"
  },
  "agent_027": {
    "id": "agent_027",
    "repo": "OpenSIN-AI/sin-code-security",
    "name": "Code Security",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "security",
      "audit",
      "sast",
      "pentest"
    ],
    "status": "unknown"
  },
  "agent_028": {
    "id": "agent_028",
    "repo": "OpenSIN-AI/sin-coding-ceo",
    "name": "Coding CEO",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "ceo",
      "strategy",
      "architecture"
    ],
    "status": "unknown"
  },
  "agent_029": {
    "id": "agent_029",
    "repo": "OpenSIN-AI/sin-frontend",
    "name": "Frontend",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "frontend",
      "ui",
      "react",
      "css"
    ],
    "status": "unknown"
  },
  "agent_030": {
    "id": "agent_030",
    "repo": "OpenSIN-AI/sin-designer",
    "name": "Designer",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "design",
      "ui-ux",
      "graphics",
      "branding"
    ],
    "status": "unknown"
  },
  "agent_031": {
    "id": "agent_031",
    "repo": "OpenSIN-AI/sin-github-issues",
    "name": "GitHub Issues",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "github",
      "issues",
      "pr",
      "workflow"
    ],
    "status": "unknown"
  },
  "agent_032": {
    "id": "agent_032",
    "repo": "OpenSIN-AI/sin-tester",
    "name": "Tester",
    "category": "Coding & Devops",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "testing",
      "qa",
      "unit",
      "e2e"
    ],
    "status": "unknown"
  },
  "agent_033": {
    "id": "agent_033",
    "repo": "OpenSIN-AI/A2A-SIN-Code-GitLab-LogsCenter",
    "name": "GitLab LogsCenter",
    "category": "Coding & Devops",
    "hostType": "hf",
    "host": "https://a2a-sin-code-gitlab-logscenter.hf.space",
    "capabilities": [
      "gitlab",
      "logs",
      "ci",
      "monitoring"
    ],
    "status": "unknown"
  },
  "agent_034": {
    "id": "agent_034",
    "repo": "OpenSIN-AI/sin-hacker-ai",
    "name": "Hacker AI",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "ai-security",
      "prompt-injection",
      "llm-hacking"
    ],
    "status": "unknown"
  },
  "agent_035": {
    "id": "agent_035",
    "repo": "OpenSIN-AI/sin-hacker-audit",
    "name": "Hacker Audit",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "audit",
      "compliance",
      "pentest",
      "report"
    ],
    "status": "unknown"
  },
  "agent_036": {
    "id": "agent_036",
    "repo": "OpenSIN-AI/sin-hacker-auth",
    "name": "Hacker Auth",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "auth",
      "bypass",
      "oauth",
      "tokens"
    ],
    "status": "unknown"
  },
  "agent_037": {
    "id": "agent_037",
    "repo": "OpenSIN-AI/sin-hacker-cloud",
    "name": "Hacker Cloud",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "cloud",
      "aws",
      "gcp",
      "azure"
    ],
    "status": "unknown"
  },
  "agent_038": {
    "id": "agent_038",
    "repo": "OpenSIN-AI/sin-hacker-crypto",
    "name": "Hacker Crypto",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "crypto",
      "blockchain",
      "defi",
      "web3"
    ],
    "status": "unknown"
  },
  "agent_039": {
    "id": "agent_039",
    "repo": "OpenSIN-AI/sin-hacker-exploit",
    "name": "Hacker Exploit",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "exploit",
      "cve",
      "poc",
      "rce"
    ],
    "status": "unknown"
  },
  "agent_040": {
    "id": "agent_040",
    "repo": "OpenSIN-AI/sin-hacker-forensics",
    "name": "Hacker Forensics",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "forensics",
      "analysis",
      "evidence",
      "chain"
    ],
    "status": "unknown"
  },
  "agent_041": {
    "id": "agent_041",
    "repo": "OpenSIN-AI/sin-hacker-fuzz",
    "name": "Hacker Fuzz",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "fuzzing",
      "vuln-discovery",
      "inputs"
    ],
    "status": "unknown"
  },
  "agent_042": {
    "id": "agent_042",
    "repo": "OpenSIN-AI/sin-hacker-iot",
    "name": "Hacker IoT",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "iot",
      "embedded",
      "hardware",
      "firmware"
    ],
    "status": "unknown"
  },
  "agent_043": {
    "id": "agent_043",
    "repo": "OpenSIN-AI/sin-hacker-malware",
    "name": "Hacker Malware",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "malware",
      "analysis",
      "reverse",
      "sandbox"
    ],
    "status": "unknown"
  },
  "agent_044": {
    "id": "agent_044",
    "repo": "OpenSIN-AI/sin-hacker-mobile",
    "name": "Hacker Mobile",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "mobile",
      "ios",
      "android",
      "app"
    ],
    "status": "unknown"
  },
  "agent_045": {
    "id": "agent_045",
    "repo": "OpenSIN-AI/sin-hacker-network",
    "name": "Hacker Network",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "network",
      "tcp-ip",
      "protocols",
      "scan"
    ],
    "status": "unknown"
  },
  "agent_046": {
    "id": "agent_046",
    "repo": "OpenSIN-AI/sin-hacker-recon",
    "name": "Hacker Recon",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "recon",
      "enum",
      "osint",
      "subdomains"
    ],
    "status": "unknown"
  },
  "agent_047": {
    "id": "agent_047",
    "repo": "OpenSIN-AI/sin-hacker-redteam",
    "name": "Hacker Redteam",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "redteam",
      "simulation",
      "adversary"
    ],
    "status": "unknown"
  },
  "agent_048": {
    "id": "agent_048",
    "repo": "OpenSIN-AI/sin-hacker-social",
    "name": "Hacker Social",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "social-engineering",
      "phishing",
      "vishing"
    ],
    "status": "unknown"
  },
  "agent_049": {
    "id": "agent_049",
    "repo": "OpenSIN-AI/sin-hacker-web",
    "name": "Hacker Web",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "web",
      "xss",
      "sqli",
      "csrf"
    ],
    "status": "unknown"
  },
  "agent_050": {
    "id": "agent_050",
    "repo": "OpenSIN-AI/sin-bugbounty",
    "name": "Bug Bounty",
    "category": "Security & Hacking",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "bugbounty",
      "hackerone",
      "bugcrowd"
    ],
    "status": "unknown"
  },
  "agent_051": {
    "id": "agent_051",
    "repo": "OpenSIN-AI/sin-team-orchestrator",
    "name": "Team Orchestrator",
    "category": "Team & Orchestration",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "orchestration",
      "dispatch",
      "monitor"
    ],
    "status": "unknown"
  },
  "agent_052": {
    "id": "agent_052",
    "repo": "OpenSIN-AI/sin-team-apple-apps",
    "name": "Team Apple Apps",
    "category": "Team & Orchestration",
    "hostType": "hf",
    "host": "https://a2a-sin-team-apple-apps.hf.space",
    "capabilities": [
      "apple",
      "automation",
      "shortcuts"
    ],
    "status": "unknown"
  },
  "agent_053": {
    "id": "agent_053",
    "repo": "OpenSIN-AI/sin-team-company",
    "name": "Team Company",
    "category": "Team & Orchestration",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "company",
      "management",
      "hr"
    ],
    "status": "unknown"
  },
  "agent_054": {
    "id": "agent_054",
    "repo": "OpenSIN-AI/sin-team-creator",
    "name": "Team Creator",
    "category": "Team & Orchestration",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "content",
      "creative",
      "media"
    ],
    "status": "unknown"
  },
  "agent_055": {
    "id": "agent_055",
    "repo": "OpenSIN-AI/sin-team-google-apps",
    "name": "Team Google Apps",
    "category": "Team & Orchestration",
    "hostType": "hf",
    "host": "https://a2a-sin-team-google-apps.hf.space",
    "capabilities": [
      "google",
      "docs",
      "sheets",
      "drive"
    ],
    "status": "unknown"
  },
  "agent_056": {
    "id": "agent_056",
    "repo": "OpenSIN-AI/sin-team-marketing",
    "name": "Team Marketing",
    "category": "Team & Orchestration",
    "hostType": "hf",
    "host": "https://a2a-sin-team-marketing.hf.space",
    "capabilities": [
      "marketing",
      "campaigns",
      "seo"
    ],
    "status": "unknown"
  },
  "agent_057": {
    "id": "agent_057",
    "repo": "OpenSIN-AI/sin-team-shop",
    "name": "Team Shop",
    "category": "Team & Orchestration",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "shop",
      "ecommerce",
      "products"
    ],
    "status": "unknown"
  },
  "agent_058": {
    "id": "agent_058",
    "repo": "OpenSIN-AI/sin-team-social",
    "name": "Team Social",
    "category": "Team & Orchestration",
    "hostType": "hf",
    "host": "https://a2a-sin-team-social.hf.space",
    "capabilities": [
      "social",
      "posting",
      "engagement"
    ],
    "status": "unknown"
  },
  "agent_059": {
    "id": "agent_059",
    "repo": "OpenSIN-AI/sin-team-worker",
    "name": "Team Worker",
    "category": "Team & Orchestration",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "worker",
      "tasks",
      "automation"
    ],
    "status": "unknown"
  },
  "agent_060": {
    "id": "agent_060",
    "repo": "OpenSIN-AI/A2A-SIN-Team-lawyer",
    "name": "Team Lawyer",
    "category": "Team & Orchestration",
    "hostType": "hf",
    "host": "https://a2a-sin-team-lawyer.hf.space",
    "capabilities": [
      "legal",
      "contracts",
      "compliance"
    ],
    "status": "unknown"
  },
  "agent_061": {
    "id": "agent_061",
    "repo": "OpenSIN-AI/A2A-SIN-Community",
    "name": "Community",
    "category": "Team & Orchestration",
    "hostType": "hf",
    "host": "https://a2a-sin-community.hf.space",
    "capabilities": [
      "community",
      "discord",
      "discord"
    ],
    "status": "unknown"
  },
  "agent_062": {
    "id": "agent_062",
    "repo": "OpenSIN-AI/sin-apple-device-control",
    "name": "Apple Device Control",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "apple",
      "device",
      "control",
      "macos"
    ],
    "status": "unknown"
  },
  "agent_063": {
    "id": "agent_063",
    "repo": "OpenSIN-AI/sin-apple-facetime",
    "name": "Apple Facetime",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "facetime",
      "video",
      "call"
    ],
    "status": "unknown"
  },
  "agent_064": {
    "id": "agent_064",
    "repo": "OpenSIN-AI/sin-apple-mail",
    "name": "Apple Mail",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "mail",
      "email",
      "send",
      "read"
    ],
    "status": "unknown"
  },
  "agent_065": {
    "id": "agent_065",
    "repo": "OpenSIN-AI/sin-apple-mobile",
    "name": "Apple Mobile",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "iphone",
      "ios",
      "continuity"
    ],
    "status": "unknown"
  },
  "agent_066": {
    "id": "agent_066",
    "repo": "OpenSIN-AI/sin-apple-notes",
    "name": "Apple Notes",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "notes",
      "create",
      "read",
      "organize"
    ],
    "status": "unknown"
  },
  "agent_067": {
    "id": "agent_067",
    "repo": "OpenSIN-AI/sin-apple-notifications",
    "name": "Apple Notifications",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "notifications",
      "alerts",
      "push"
    ],
    "status": "unknown"
  },
  "agent_068": {
    "id": "agent_068",
    "repo": "OpenSIN-AI/sin-apple-reminders",
    "name": "Apple Reminders",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "reminders",
      "tasks",
      "due-date"
    ],
    "status": "unknown"
  },
  "agent_069": {
    "id": "agent_069",
    "repo": "OpenSIN-AI/sin-apple-safari-webkit",
    "name": "Apple Safari Webkit",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "safari",
      "webkit",
      "browser"
    ],
    "status": "unknown"
  },
  "agent_070": {
    "id": "agent_070",
    "repo": "OpenSIN-AI/sin-apple-calendar-contacts",
    "name": "Apple Calendar Contacts",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "calendar",
      "contacts",
      "events"
    ],
    "status": "unknown"
  },
  "agent_071": {
    "id": "agent_071",
    "repo": "OpenSIN-AI/sin-apple-photos-files",
    "name": "Apple Photos Files",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "photos",
      "files",
      "storage"
    ],
    "status": "unknown"
  },
  "agent_072": {
    "id": "agent_072",
    "repo": "OpenSIN-AI/sin-apple-system-settings",
    "name": "Apple System Settings",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "settings",
      "config",
      "prefs"
    ],
    "status": "unknown"
  },
  "agent_073": {
    "id": "agent_073",
    "repo": "OpenSIN-AI/sin-apple-shortcuts",
    "name": "Apple Shortcuts",
    "category": "Apple Ecosystem",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "shortcuts",
      "automations",
      "macos"
    ],
    "status": "unknown"
  },
  "agent_074": {
    "id": "agent_074",
    "repo": "OpenSIN-AI/sin-server",
    "name": "Server",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "server",
      "api",
      "runtime"
    ],
    "status": "unknown"
  },
  "agent_075": {
    "id": "agent_075",
    "repo": "OpenSIN-AI/sin-cloudflare",
    "name": "Cloudflare",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "cloudflare",
      "dns",
      "deploy"
    ],
    "status": "unknown"
  },
  "agent_076": {
    "id": "agent_076",
    "repo": "OpenSIN-AI/sin-storage",
    "name": "Storage",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "storage",
      "s3",
      "files"
    ],
    "status": "unknown"
  },
  "agent_077": {
    "id": "agent_077",
    "repo": "OpenSIN-AI/sin-stripe",
    "name": "Stripe",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "stripe",
      "payments",
      "billing"
    ],
    "status": "unknown"
  },
  "agent_078": {
    "id": "agent_078",
    "repo": "OpenSIN-AI/sin-supabase",
    "name": "Supabase",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "supabase",
      "db",
      "auth",
      "storage"
    ],
    "status": "unknown"
  },
  "agent_079": {
    "id": "agent_079",
    "repo": "OpenSIN-AI/sin-tax",
    "name": "Tax",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "tax",
      "compliance",
      "accounting"
    ],
    "status": "unknown"
  },
  "agent_080": {
    "id": "agent_080",
    "repo": "OpenSIN-AI/sin-opal",
    "name": "Opal",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "ai",
      "models",
      "inference"
    ],
    "status": "unknown"
  },
  "agent_081": {
    "id": "agent_081",
    "repo": "OpenSIN-AI/sin-opencode",
    "name": "Opencode",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "opencode",
      "llm",
      "cli"
    ],
    "status": "unknown"
  },
  "agent_082": {
    "id": "agent_082",
    "repo": "OpenSIN-AI/sin-imessage",
    "name": "Imessage",
    "category": "Infrastructure",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "imessage",
      "sms",
      "messaging"
    ],
    "status": "unknown"
  },
  "agent_083": {
    "id": "agent_083",
    "repo": "OpenSIN-AI/sin-terminal",
    "name": "Terminal",
    "category": "Infrastructure",
    "hostType": "local",
    "host": "localhost",
    "capabilities": [
      "terminal",
      "shell",
      "commands"
    ],
    "status": "unknown"
  },
  "agent_084": {
    "id": "agent_084",
    "repo": "OpenSIN-AI/sin-repo-sync",
    "name": "Repo Sync",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "git",
      "sync",
      "mirror"
    ],
    "status": "unknown"
  },
  "agent_085": {
    "id": "agent_085",
    "repo": "OpenSIN-AI/A2A-SIN-N8N",
    "name": "N8N",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "n8n",
      "workflows",
      "automation"
    ],
    "status": "unknown"
  },
  "agent_086": {
    "id": "agent_086",
    "repo": "OpenSIN-AI/sin-oraclecloud-mcp",
    "name": "OracleCloud MCP",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "oci",
      "compute",
      "mcp"
    ],
    "status": "unknown"
  },
  "agent_087": {
    "id": "agent_087",
    "repo": "OpenSIN-AI/A2A-SIN-Github-Action",
    "name": "Github Action",
    "category": "Infrastructure",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "github",
      "actions",
      "ci"
    ],
    "status": "unknown"
  },
  "agent_088": {
    "id": "agent_088",
    "repo": "OpenSIN-AI/sin-shop-finance",
    "name": "Shop Finance",
    "category": "Shop & Finance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "finance",
      "accounting",
      "billing"
    ],
    "status": "unknown"
  },
  "agent_089": {
    "id": "agent_089",
    "repo": "OpenSIN-AI/sin-shop-logistic",
    "name": "Shop Logistic",
    "category": "Shop & Finance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "logistics",
      "shipping",
      "inventory"
    ],
    "status": "unknown"
  },
  "agent_090": {
    "id": "agent_090",
    "repo": "OpenSIN-AI/sin-team-shop",
    "name": "Team Shop",
    "category": "Shop & Finance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "shop",
      "management",
      "products"
    ],
    "status": "unknown"
  },
  "agent_091": {
    "id": "agent_091",
    "repo": "OpenSIN-AI/sin-tiktok-shop",
    "name": "TikTok Shop",
    "category": "Shop & Finance",
    "hostType": "hf",
    "host": "https://a2a-sin-tiktok-shop.hf.space",
    "capabilities": [
      "tiktok",
      "shop",
      "ecommerce"
    ],
    "status": "unknown"
  },
  "agent_092": {
    "id": "agent_092",
    "repo": "OpenSIN-AI/A2A-SIN-Compliance",
    "name": "Compliance",
    "category": "Legal &amp; Compliance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "compliance",
      "legal",
      "gdpr"
    ],
    "status": "unknown"
  },
  "agent_093": {
    "id": "agent_093",
    "repo": "OpenSIN-AI/A2A-SIN-Contract",
    "name": "Contract",
    "category": "Legal &amp; Compliance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "contracts",
      "templates",
      "legal"
    ],
    "status": "unknown"
  },
  "agent_094": {
    "id": "agent_094",
    "repo": "OpenSIN-AI/A2A-SIN-Damages",
    "name": "Damages",
    "category": "Legal &amp; Compliance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "damages",
      "claims",
      "legal"
    ],
    "status": "unknown"
  },
  "agent_095": {
    "id": "agent_095",
    "repo": "OpenSIN-AI/A2A-SIN-Evidence",
    "name": "Evidence",
    "category": "Legal &amp; Compliance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "evidence",
      "forensics",
      "legal"
    ],
    "status": "unknown"
  },
  "agent_096": {
    "id": "agent_096",
    "repo": "OpenSIN-AI/A2A-SIN-Patents",
    "name": "Patents",
    "category": "Legal &amp; Compliance",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "patents",
      "ip",
      "legal"
    ],
    "status": "unknown"
  },
  "agent_097": {
    "id": "agent_097",
    "repo": "OpenSIN-AI/A2A-SIN-Team-lawyer",
    "name": "Team Lawyer",
    "category": "Legal &amp; Compliance",
    "hostType": "hf",
    "host": "https://a2a-sin-team-lawyer.hf.space",
    "capabilities": [
      "legal",
      "contracts",
      "compliance"
    ],
    "status": "unknown"
  },
  "agent_098": {
    "id": "agent_098",
    "repo": "OpenSIN-AI/A2A-SIN-Paragraph",
    "name": "Paragraph",
    "category": "Legal &amp; Compliance",
    "hostType": "hf",
    "host": "https://a2a-sin-paragraph.hf.space",
    "capabilities": [
      "newsletter",
      "publishing",
      "legal"
    ],
    "status": "unknown"
  },
  "agent_099": {
    "id": "agent_099",
    "repo": "OpenSIN-AI/sin-telegrambot-cli",
    "name": "TelegramBot CLI",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "telegram",
      "bots",
      "cli"
    ],
    "status": "unknown"
  },
  "agent_100": {
    "id": "agent_100",
    "repo": "OpenSIN-AI/sin-passwordmanager",
    "name": "Passwordmanager",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "passwords",
      "secrets",
      "vault"
    ],
    "status": "unknown"
  },
  "agent_101": {
    "id": "agent_101",
    "repo": "OpenSIN-AI/sin-authenticator",
    "name": "Authenticator",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "totp",
      "2fa",
      "auth"
    ],
    "status": "unknown"
  },
  "agent_102": {
    "id": "agent_102",
    "repo": "OpenSIN-AI/sin-google-apps",
    "name": "Google Apps",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "google",
      "docs",
      "sheets",
      "drive"
    ],
    "status": "unknown"
  },
  "agent_103": {
    "id": "agent_103",
    "repo": "OpenSIN-AI/sin-research",
    "name": "Research",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "research",
      "analysis",
      "reports"
    ],
    "status": "unknown"
  },
  "agent_104": {
    "id": "agent_104",
    "repo": "OpenSIN-AI/sin-mindrift",
    "name": "Mindrift",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "mindrift",
      "ai",
      "cognitive"
    ],
    "status": "unknown"
  },
  "agent_105": {
    "id": "agent_105",
    "repo": "OpenSIN-AI/sin-community",
    "name": "Community",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "community",
      "discord",
      "forum"
    ],
    "status": "unknown"
  },
  "agent_106": {
    "id": "agent_106",
    "repo": "OpenSIN-AI/A2A-SIN-ClaimWriter",
    "name": "ClaimWriter",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "claims",
      "writing",
      "auto"
    ],
    "status": "unknown"
  },
  "agent_107": {
    "id": "agent_107",
    "repo": "OpenSIN-AI/sin-issues",
    "name": "Issues",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "issues",
      "bugs",
      "tracking"
    ],
    "status": "unknown"
  },
  "agent_108": {
    "id": "agent_108",
    "repo": "OpenSIN-AI/sin-2captcha-worker",
    "name": "2Captcha Worker",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "captcha",
      "solving",
      "2captcha"
    ],
    "status": "unknown"
  },
  "agent_109": {
    "id": "agent_109",
    "repo": "OpenSIN-AI/sin-a2a-agent-forge-skill",
    "name": "A2A Agent Forge",
    "category": "OpenSIN Core",
    "hostType": "oci",
    "host": "http://92.5.60.87:5678",
    "capabilities": [
      "forge",
      "agents",
      "creation"
    ],
    "status": "unknown"
  }
};
function loadA2ARegistry() {
    return A2A_REGISTRY;
}
exports.loadA2ARegistry = loadA2ARegistry;
