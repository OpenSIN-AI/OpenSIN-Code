# MANDATE 0.18: THE SLASH COMMAND PROTOCOL & AUTONOMY LAW (V19.2)

**Design for Autonomy. Build for Control.**

In the AI era, every project must be autonomously manageable by AI agents. We do not build static software; we build controllable systems.

**1. The `/projectname/SLASH.md` Mandate:**
- Every project MUST have a `SLASH.md` file in its root.
- This file documents ALL available slash commands for that project.
- It serves as the "Instruction Manual" for AI agents to control the project.

**2. The Autonomy Requirement:**
- Every mutable entity (titles, descriptions, offers, prices, products, blogs, media) MUST be changeable via:
  - A. An API endpoint (documented in `/docs/postman/`).
  - B. A Slash Command (documented in `SLASH.md`).

**3. Slash Command Standard:**
- Format: `/cmd [action] [target] --param value`
- Example: `/product update "Super Shoes" --price 99.99`
- Implementation: These commands must map to underlying API calls or scripts.

**Why?** So that future AI swarms can autonomously manage, optimize, and scale the business without manual coding for every content change.

---

**Source:** ~/.config/opencode/Agents.md (Line 1146-1168)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
