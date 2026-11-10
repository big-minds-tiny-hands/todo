# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

The labels live in the ENG team's **Execution Readiness** label group in Linear. A Linear label group allows one label per issue, so applying a new role replaces the old one.

| Label in mattpocock/skills | Label in our tracker | Linear label ID                        | Meaning                                  |
| -------------------------- | -------------------- | -------------------------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | `51b0d35c-adc8-41a9-95f3-0d8836417f23` | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | `1b39694a-1bf1-4911-a8a7-78f7d52131e3` | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | `001769d8-1510-4930-9a83-887c07a855f9` | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | `df7963b4-a504-4530-a1b7-66ca7276a426` | Requires human implementation            |
| `wontfix`                  | `wontfix`            | `91337956-5971-4817-9b57-186e2e851f6f` | Will not be actioned                     |

The same group also has `needs-human-decision` and `external-blocker`. The skills do not use them.

Wayfinder labels (ENG team, **Wayfinder** group):

| Label                 | Linear label ID                        |
| --------------------- | -------------------------------------- |
| `wayfinder:map`       | `f7b7285b-2c41-4cce-b9cc-9ef25913fbab` |
| `wayfinder:research`  | `4fd39c79-9f64-498f-b694-dbaf8b8e7012` |
| `wayfinder:prototype` | `6e9fa8bd-7469-41d7-b431-8d4d09a08fdf` |
| `wayfinder:grilling`  | `5f95c454-78a2-40a3-9e20-f18ff885e3dd` |
| `wayfinder:task`      | `d6f13d92-63f0-4b80-a8d8-0b2693f09e23` |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label from this table.

Edit the right-hand columns to match whatever vocabulary you actually use.
