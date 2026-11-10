# Issue tracker: Linear, synced to GitHub

Issues and specs for this repo live in Linear. Linear is the source of truth.

- Team: ENG (`eef25db4-c69a-4b6c-a037-cae1f926866a`)
- Project: [Todo](https://linear.app/big-minds-tiny-hands/project/todo-892e0b5657a8) (`767c225c-f84b-49b4-95ec-44bbb93681be`)
- GitHub sync: each ENG issue is mirrored to a GitHub issue in `big-minds-tiny-hands/tiny-solution`. For example, ENG-3168 is tiny-solution#5072. The sync is automatic. Do not create or edit the GitHub copy by hand.

Use `~/bin/linear` for every operation. Do not use the Linear MCP. A guard blocks it.

## Conventions

- **Read an issue**: `linear issue <NUM>`. For the body, comments and labels, use `linear gql` with `issue(id: "ENG-<NUM>") { description labels { nodes { name } } comments { nodes { body } } }`.
- **List issues**: `linear gql` with `project(id: "767c225c-...") { issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }) { nodes { identifier title labels { nodes { name } } } } }`. Add a `labels` filter to scope by triage role.
- **Create an issue**: `linear gql` with the `issueCreate` mutation. Always set `teamId` and `projectId` to the values above. Pass the title and markdown body as GraphQL variables, never interpolated into the query string.
- **Comment**: `linear comment <NUM> [body | -]`. It parents the comment to the GitHub-synced thread, so the comment also shows on the GitHub issue. Add `--top-level` for a Linear-only comment.
- **Change state**: `linear state <NUM> <StateName>`. States: Triage, Backlog, Todo, In Progress, Done, Canceled, Duplicate.
- **Apply or remove labels**: the `issueUpdate` mutation with `addedLabelIds` / `removedLabelIds`. Label IDs are in `triage-labels.md`.
- **Close**: `linear state <NUM> Done` (or `Canceled`), after a resolution comment.
- **Reference an issue**: write `ENG-<NUM>`. Do not use the GitHub number. In a PR body, `Fixes ENG-<NUM>` links the PR in Linear.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a Linear issue in the ENG team, in the Todo project, with `issueCreate`.

## When a skill says "fetch the relevant ticket"

Run `linear issue <NUM>`, then read the body and comments with `linear gql` as above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is one Linear issue with **child** issues as tickets.

- **Map**: one issue with the `wayfinder:map` label, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: an issue with `parentId` set to the map, and one `wayfinder:<type>` label (`research` / `prototype` / `grilling` / `task`). `linear children <NUM>` lists a map's children and their states.
- **Blocking**: a Linear `blocks` relation (`issueRelationCreate` with `type: blocks`, from the blocker to the blocked issue). A ticket is unblocked when every blocker is Done or Canceled.
- **Frontier**: the map's open children that have no open blocker and no assignee. The first in map order wins.
- **Claim**: assign the ticket to the driving dev and set state In Progress. Do this as the first write.
- **Resolve**: `linear comment <NUM>` with the answer, `linear state <NUM> Done`, then add a context pointer (gist and link) to the map's Decisions-so-far.
