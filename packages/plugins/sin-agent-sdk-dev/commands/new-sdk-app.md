---
description: Create and setup a new OpenSIN Agent SDK application
argument-hint: [project-name]
---

You are tasked with helping the user create a new OpenSIN Agent SDK application. Follow these steps carefully:

## Reference Documentation

Before starting, review the official documentation to ensure you provide accurate and up-to-date guidance.

## Gather Requirements

IMPORTANT: Ask these questions one at a time. Wait for the user's response before asking the next question.

Ask the questions in this order (skip any that the user has already provided via arguments):

1. **Language** (ask first): "Would you like to use TypeScript or Python?"

2. **Project name** (ask second): "What would you like to name your project?"

   - If $ARGUMENTS is provided, use that as the project name and skip this question

3. **Agent type** (ask third): "What kind of agent are you building? Some examples:
   - Coding agent (SRE, security review, code review)
   - Business agent (customer support, content creation)
   - Custom agent (describe your use case)"

4. **Starting point** (ask fourth): "Would you like:
   - A minimal 'Hello World' example to start
   - A basic agent with common features
   - A specific example based on your use case"

5. **Tooling choice** (ask fifth): Confirm which package manager to use

## Setup Plan

Based on the user's answers, create a setup plan:

1. **Project initialization**: Create directory, initialize package manager
2. **SDK Installation**: Install the OpenSIN Agent SDK (use latest versions)
3. **Create starter files**: Basic query example with proper imports
4. **Environment setup**: Create .env.example with API key placeholder
5. **Verification**: Run type checks and verify imports

## Implementation

1. Execute setup steps
2. Create all necessary files
3. Install dependencies
4. Create working example based on agent type
5. **VERIFY CODE WORKS**:
   - TypeScript: Run `bunx tsc --noEmit`
   - Python: Verify syntax

## Getting Started

Provide user with:
- How to set API key
- How to run their agent
- Next steps for customization

**ASK QUESTIONS ONE AT A TIME**