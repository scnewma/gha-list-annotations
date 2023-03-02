# List GHA Annotations

Use the Github API to list annotations for a particular repository and optionally commit.

## Usage

Run this directly with [Deno](https://deno.land/).

```
$ deno run -A https://raw.githubusercontent.com/scnewma/gha-list-annotations/main/main.ts OWNER/REPO [COMMIT]
```

If you don't specify `[COMMIT]` the latest commit from the default branch is used.
