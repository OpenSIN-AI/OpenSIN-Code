# MANDATE 0.6: THE TICKET-BASED TROUBLESHOOTING MANDATE (V17.4 - SUPREME PRECISION)

**Every error gets its own ticket file.**

Every error and its corresponding solution MUST NOT simply be noted in the project's troubleshooting file. Instead, a dedicated ticket file MUST be created for EACH failure/fix following this exact protocol:

1. **Absolute Path Logic:**
   - For project-specific issues: Create the ticket in `[PROJECT-ROOT]/troubleshooting/ts-ticket-[XX].md`
   - For infrastructure/workspace issues (OpenCode, Docker, Guides, Blueprint): Create the ticket in `/Users/jeremy/dev/sin-code/troubleshooting/ts-ticket-[XX].md`
   - *Note:* If the directory `troubleshooting/` does not exist, it MUST be created at the root level

2. **Ticket Naming:** Files MUST be named `ts-ticket-[XX].md` (e.g., `ts-ticket-01.md`), incrementing for each new ticket in that specific directory

3. **Content Requirements:** The coder AI MUST provide a highly detailed explanation including:
   - **Problem Statement:** Exactly what was the issue?
   - **Root Cause Analysis:** Why did it happen?
   - **Step-by-Step Resolution:** How was it fixed? (Detailed steps)
   - **Commands & Code:** Every command executed and every code change made
   - **Sources & References:** Links to documentation or internal guides used

4. **The "Holy Reference":** In the main module troubleshooting file (e.g., `Docs/[name]/03-[name]-troubleshooting.md`), a permanent reference MUST be added:
   - Format: `**Reference Ticket:** @/[project-name]/troubleshooting/ts-ticket-[XX].md`

5. **Additive Integrity:** This process is strictly additive. Tickets are chronological artifacts of the system's growth and recovery. NEVER delete or consolidate tickets into single files.

---

**Source:** ~/.config/opencode/Agents.md (Line 923-947)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
