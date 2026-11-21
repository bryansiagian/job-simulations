# Y Combinator — Shiptivitas Task 3: Analysis and Feature Ideas

## Scope and methodology

Feature release: **2018-06-02**. Daily active users (DAU) are distinct `user_id` values that logged in on a given UTC calendar day. A symmetric seven-day comparison avoids conflating unequal observation windows. A status change is a `card_change_history` event where `oldStatus` is not null and differs from `newStatus`; priority-only changes and initial card creation are excluded.

## Key findings

- DAU average for **2018-05-26 through 2018-06-01**: **6.86** (48 summed daily unique-user counts / 7).
- DAU average for **2018-06-02 through 2018-06-08**: **11.43** (80 summed daily unique-user counts / 7).
- Observed change: **+66.7%**. This is an association after release, not proof of causality.
- **286** recorded status changes: 167 backlog → in-progress; 103 in-progress → complete; 11 in-progress → backlog; 5 complete → in-progress.
- Card 187 has the most status changes (5); cards 137, 143, 147, and 189 have 4 each.

## Idea 1 — Due-date reminders and personal priority queue

**Hypothesis:** Workers who are prompted about tasks they own that are due soon will return to the task board more often and complete more tasks on time.

**Expected Impact:** Target +10% weekly returning active users and +10% on-time completion rate in an A/B test; these are proposed targets, *not* observed outcomes.

**What the feature is:** An optional daily digest and in-app "My priorities" view ranking assigned cards by due date and priority, with one-click access to the task. Start with opt-in notifications to avoid fatigue.

**Why test it:** The observed DAU increase after Kanban's launch suggests the task board is relevant; reminders could create repeat-use triggers. The existing dataset has no due-date or ownership fields, so those would need to be instrumented.

## Idea 2 — Stalled-task detection with contextual next steps

**Hypothesis:** Alerting workers when a card remains in progress for too long, with a quick reason-and-next-step action, will reduce bottlenecks and increase repeat visits.

**Expected Impact:** Target 15% fewer cards exceeding an agreed in-progress age threshold, with DAU as a guardrail and completion rate as a secondary metric. Targets need experimentation.

**What the feature is:** Show "stalled" badges for overdue in-progress cards and allow assignees to add a blocker reason, request assistance, or set a follow-up reminder. Managers see a concise blocked-tasks view.

**Why test it:** There were 167 recorded backlog → in-progress transitions but 103 in-progress → complete transitions; these event counts alone do *not* measure funnel conversion or prove a stall, but they motivate investigating task aging and bottlenecks.

## Idea 3 — Activity history and automatic manager digest

**Hypothesis:** A transparent card timeline and optional manager notification when tasks are completed will make the board useful to both workers and managers, increasing recurring engagement.

**Expected Impact:** Target +10% weekly manager active users and reduced manual status-checking contacts. Measure notification open rate, opt-outs, and weekly manager retention.

**What the feature is:** A visible card audit trail of who moved it, when, and between which statuses; configurable daily manager email digest summarizing completed and reopened cards (rather than a flood of individual emails).

**Why test it:** The dataset has 286 status changes, including 16 backwards transitions, demonstrating that progress is not strictly one-way. This makes history and reopening visibility potentially useful. The schema lacks actors for card changes, so attribution would require new event data.

## Files to submit and reproduce

- `answer.sql`: SQL queries for daily DAU, before/after averages, status changes per card, and daily changes per card.
- `analyze.py`: generates `charts/dau_before_after.png` and `charts/status_changes_by_card.png` from `shiptivity.db`.
- `shiptivity.db`: starter data obtained from the original simulation repository.

Run `pip install matplotlib`, then `python analyze.py` from this directory. Submit the SQL source via the Forage code-file upload, and attach graphs / ideas if the task platform accepts supplemental materials.
