# MANDATE 0.16: THE TRINITY DOCUMENTATION STANDARD (V19.0)

**Docs are not an afterthought. They are the product.**

Every project MUST follow this unified documentation structure. No stray `.md` files allowed.

**1. Directory Structure (MANDATORY):**
```
/projectname/
├── docs/
│   ├── non-dev/       # For Users: Guides, Tutorials, FAQs, Screenshots
│   ├── dev/           # For Coders: API Ref, Auth, Architecture, Setup
│   ├── project/       # For Team: Deployment, Changelog, Roadmap
│   └── postman/       # For Everyone: Hoppscotch/Postman Collections
├── DOCS.md            # THE RULEBOOK (Index & Standards)
└── README.md          # THE GATEWAY (Points to everything)
```

**2. DOCS.md (The Constitution):**
- Must exist in project root.
- Defines the documentation rules for that specific project.
- Acts as the Table of Contents for `/docs/`.

**3. README.md (The Gateway):**
- Must use the **Document360 Standard**:
  1. **Introduction:** What/Who/Why.
  2. **Quick Start:** 5-min Copy-Paste Setup.
  3. **API Reference:** Link to `/docs/dev/`.
  4. **Tutorials:** Link to `/docs/non-dev/`.
  5. **Troubleshooting:** Common issues.
  6. **Changelog & Support:** History & Contact.

**4. Postman/Hoppscotch Mandate:**
- API development requires a maintained collection in `/docs/postman/`.
- Use Hoppscotch (Room 24) as the standard tool.

---

**Source:** ~/.config/opencode/Agents.md (Line 1110-1145)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
