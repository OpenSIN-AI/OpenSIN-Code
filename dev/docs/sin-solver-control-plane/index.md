# SIN-Solver Control Plane Documentation

The `sin-solver-control-plane` is the governance, quality, and observability layer for the SIN-Solver ecosystem. It ensures that all 48+ agents across the fleet meet enterprise-grade standards before any action is taken.

## Core Commands

| Command | Purpose |
|---------|---------|
| `sin doctor` | Repos-side health check (lint, tests, config, dependencies). |
| `sin preflight` | Workflow-specific gate (check eval scores, drift, health) before tasks. |
| `sin eval` | Computes quality scores from trace artifacts and enforces release gates. |
| `sin docs` | Reconciliation report for repo docs vs. Google/GitHub projection surfaces. |
| `sin govern` | Fleet-wide governance aggregator that computes `governedState` for all agents. |

## Key Concepts

- **Fleet Metadata (v1)**: The canonical source of truth for all agents and teams.
- **Governed State**: A machine-readable state per agent (`ready`, `degraded`, `blocked`, `unknown`).
- **Eval Release Gate**: A threshold-based policy that prevents deploying or running low-quality agents.
- **Projection Pipeline**: Automatically syncs repo truth to the Dashboard and Google Sheets.

## Project Structure

- `contracts/`: JSON schemas for all metadata and artifacts.
- `packages/cli/`: The `sin` command-line tool.
- `packages/core/`: Shared logic for checks, eval, and docs.
- `registry/`: The canonical `fleet-metadata.v1.json`.
- `scripts/`: Utilities for projection, parity, and fleet-wide governance.
