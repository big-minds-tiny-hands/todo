# Triage Labels

The skills speak in terms of five canonical triage roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

Todo issues live in the Linear OPS team (see `issue-tracker.md`). OPS has no Execution Readiness label group, so these roles have no labels yet. Until the group exists in OPS, use the issue state instead:

| Role              | Use in OPS                                                    |
| ----------------- | ------------------------------------------------------------- |
| `needs-triage`    | State Triage                                                  |
| `needs-info`      | State Backlog, plus a comment that names the missing fact     |
| `ready-for-agent` | State Todo, with a body that is the whole brief               |
| `ready-for-human` | State Todo, assigned to a person                              |
| `wontfix`         | State Canceled, plus a resolution comment                     |

The Wayfinder labels are also ENG-only, so `/wayfinder` maps cannot run in OPS yet.

Work Type labels (Feature, Bug, Research, Infra/Deploy, Documentation, Security) exist in OPS. Apply one per issue.
