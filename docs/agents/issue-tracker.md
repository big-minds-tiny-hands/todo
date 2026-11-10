# Issue tracker: Linear (OPS team, not synced)

Issues and specs for this repo live in Linear. Linear is the source of truth.

- Team: OPS, Operations (`95abff95-6947-48fc-991c-d8f5e980966c`)
- Project: [Todo](https://linear.app/big-minds-tiny-hands/project/todo-892e0b5657a8) (`767c225c-f84b-49b4-95ec-44bbb93681be`)
- GitHub sync: none. The ENG team mirrors its issues into `big-minds-tiny-hands/tiny-solution`, which is the wrong repo for this app, so Todo issues live in OPS. Do not file Todo issues in ENG.

Use `~/bin/linear` for every operation.

## Conventions

- **Read an issue**: `linear issue <NUM>`. For the body, comments and labels, use `linear gql` with `issue(id: "OPS-<NUM>") { description labels { nodes { name } } comments { nodes { body } } }`.
- **List issues**: `linear gql` with `project(id: "767c225c-f84b-49b4-95ec-44bbb93681be") { issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }) { nodes { identifier title labels { nodes { name } } } } }`.
- **Create an issue**: `linear gql` with the `issueCreate` mutation. Always set `teamId` and `projectId` to the values above. Pass the title and markdown body as GraphQL variables, never interpolated into the query string.
- **Comment**: `linear comment <NUM> --top-level [body | -]`.
- **Change state**: `linear state <NUM> <StateName>`. States: Triage, Backlog, Todo, In Progress, Done, Canceled, Duplicate.
- **Labels**: OPS has the Work Type group (Feature, Bug, Research, Infra/Deploy, Documentation, Security). It has no Execution Readiness or Wayfinder group. See `triage-labels.md`.
- **Close**: `linear state <NUM> Done` (or `Canceled`), after a resolution comment.
- **Reference an issue**: write `OPS-<NUM>`. In a PR body, `Fixes OPS-<NUM>` links the PR in Linear.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a Linear issue in the OPS team, in the Todo project, with `issueCreate`.

## When a skill says "fetch the relevant ticket"

Run `linear issue <NUM>`, then read the body and comments with `linear gql` as above.
