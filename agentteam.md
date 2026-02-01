# Agent Team Collaboration Guide

**Purpose:** Coordinate multiple AI agents working on the Research Workspace project

## Overview

This project uses AI agents (Claude Code instances) for task execution. Each agent operates independently but coordinates through this document.

## Agent Roles

### 1. Orchestrator (Main Session)
- **Responsibility:** Overall project coordination, planning, and delegation
- **Tools Available:** All tools (Bash, Read, Write, Edit, Task, etc.)
- **Activities:**
  - Create and execute phase plans
  - Spawn sub-agents for parallel work
  - Review and approve completed work
  - Manage git commits and state tracking
  - Coordinate verification and gap closure

### 2. Executor Agents (gsd-executor)
- **Responsibility:** Execute PLAN.md files with specific tasks
- **Tools Available:** Execution tools (Bash, Read, Write, Edit, Task)
- **Activities:**
  - Read plan objectives and context
  - Execute tasks atomically (one task = one git commit)
  - Create SUMMARY.md upon completion
  - Update STATE.md with decisions
  - Handle checkpoints by returning to orchestrator

### 3. Verifier Agents (gsd-verifier)
- **Responsibility:** Verify phase goals against actual codebase
- **Tools Available:** Inspection tools (Read, Grep, Glob, Bash)
- **Activities:**
  - Check must_haves from PLAN.md frontmatter
  - Verify artifacts exist and aren't stubs
  - Trace key_links between components
  - Create VERIFICATION.md with pass/fail status
  - Identify gaps for /gsd:plan-phase --gaps

### 4. Specialist Agents (on-demand)
- **Mapper (gsd-codebase-mapper):** Explore and document codebase structure
- **Researcher (gsd-research-phase):** Research unknown domains before planning
- **Debugger (systematic-debugging):** Investigate bugs and failures

## Collaboration Protocol

### Task Delegation

**When Orchestrator delegates work:**

1. **Identify independent tasks** that can run in parallel
2. **Create Task calls** with specific prompts:
   ```
   Task(prompt="Execute plan at {plan_path}

   Plan: @{plan_path}
   Project state: @.planning/STATE.md
   Commit each task atomically. Create SUMMARY.md.",
          subagent_type="gsd-executor")
   ```

3. **Wait for completion** - Task tool blocks until agent finishes
4. **Review SUMMARY.md** - Check what was accomplished
5. **Verify and integrate** - Review commits, update state if needed

### Example: Parallel Execution

**Scenario:** Phase has 3 independent plans

```
# Orchestrator spawns 3 agents in parallel:
Task(prompt="Execute plan 01-01", subagent_type="gsd-executor")
Task(prompt="Execute plan 01-02", subagent_type="gsd-executor")
Task(prompt="Execute plan 01-03", subagent_type="gsd-executor")

# All 3 run in parallel
# Orchestrator waits for all to complete
# Reviews 3 SUMMARY.md files
# Continues to next wave
```

### Agent Communication

**Through Files:**
- **PLAN.md:** Orchestrator → Executor (task specification)
- **SUMMARY.md:** Executor → Orchestrator (task completion report)
- **VERIFICATION.md:** Verifier → Orchestrator (gap findings)
- **STATE.md:** All agents → Orchestrator (decisions, context)

**Direct Agent Interaction:** Rare - typically through orchestrator, not agent-to-agent

### Work Marking Convention

**To mark work as done in agentteam.md:**

When an agent completes work, update this file:

```markdown
## Work Completed

### [Date YYYY-MM-DD]

**Agent:** Executor (01-01)
**Plan:** 01-01 Mock Authentication
**Status:** ✓ Complete
**Commit:** 6931ffc, 800e0ea, etc.
**Summary:** .planning/phases/01-authentication/01-01-SUMMARY.md

---

**Agent:** Verifier (01-01)
**Plan:** Phase 1 verification
**Status:** ✓ Complete
**Commit:** (verification committed by orchestrator)
**Summary:** .planning/phases/01-authentication/01-authentication-VERIFICATION.md
```

## Task Assignment Patterns

### Pattern 1: Sequential Plans

```
Phase with 3 sequential plans:
- Plan 01 (autonomous) → Spawns executor, wait for SUMMARY
- Plan 02 (depends on 01) → Spawn executor after 01 complete
- Plan 03 (depends on 02, has checkpoint) → Spawn executor, handle checkpoint, resume
```

### Pattern 2: Parallel Wave

```
Wave 1 (3 autonomous plans):
- Spawn 3 executors in parallel
- Wait for all 3
- Review all SUMMARYs
- Proceed to Wave 2
```

### Pattern 3: Gap Closure

```
Verification found gaps:
1. Spawn verifier to check must_haves
2. VERIFICATION.md shows gaps
3. Orchestrator creates gap closure plan (01-02)
4. Spawn executor to fix gaps
5. Spawn verifier to re-check
6. Loop until passed
```

## Agent Independence

Each executor agent:
- Gets fresh 200k context window
- Loads plan and context independently
- Works autonomously on its tasks
- Creates SUMMARY.md for orchestrator to review
- Returns to orchestrator when complete (or checkpoint)

No agent "manages" another agent directly. All coordination happens through:
1. Plan files (orchestrator → executor)
2. Summary files (executor → orchestrator)
3. State updates (all → orchestrator)

## Error Handling

### Executor Fails Mid-Task

**If executor crashes/errors:**
1. SUMMARY.md won't exist or is incomplete
2. Orchestrator detects missing SUMMARY
3. Orchestrator reviews git commits to see what was done
4. Decides: retry with fix instructions, or spawn debugger agent
5. Updates STATE.md with blocker if needed

### Verification Finds Gaps

**If verifier finds gaps:**
1. VERIFICATION.md created with `gaps: [...]`
2. Orchestrator presents gaps to user
3. Offers: `/gsd:plan-phase {phase} --gaps`
4. Gap closure plan created
5. Executor fixes gaps
6. Re-verify → loop until passed

## Current Project Context

**Project:** Research Workspace
**Current Phase:** 2 (File & Project Management)
**Last Completed:** Phase 1 (Authentication & User Management)

### Recent Agent Activity

**2025-02-01:**
- **Executor (01-01):** Completed mock authentication system (16 min)
- **Executor (01-02):** Fixed AppContent integration (4 min)
- **Verifier (01-01):** Verified phase goals (4/4 passed)

### Work Queue

**Ready to start:**
- Phase 2 planning (/gsd:plan-phase 2)
- Phase 2 execution (/gsd:execute-phase 2)

**Blocked:** None

## Communication Summary

**Total agents spawned:** 4 (3 executors, 1 verifier)
**Successful parallel waves:** 1
**Gap closure cycles:** 1 (found and fixed 2 gaps)
**Average plan duration:** 10 minutes

---

## Notes

- Agents don't "talk" to each other - they communicate through files
- Orchestrator is always in main session, never delegates overall control
- Executor agents are temporary - spawned for a plan, terminated after
- Verifier agents are temporary - spawned for verification, terminated after
- No "agent manager" - the STATE.md file serves this purpose
