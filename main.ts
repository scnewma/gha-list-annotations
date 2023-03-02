async function main(): Promise<void> {
  if (Deno.args.length < 1 || Deno.args.length > 2) {
    usage();
  }
  const nameWithOwner = Deno.args[0];
  let commit = Deno.args[1];

  if (nameWithOwner.split("/").length != 2) {
    console.error("First argument should be in OWNER/REPO format.\n");
    usage();
  }

  const ghToken = Deno.env.get("GITHUB_TOKEN");
  if (!ghToken) {
    console.error(
      "GITHUB_TOKEN environment variable needs to be set to authenticate to Github API",
    );
    Deno.exit(1);
  }

  // lookup HEAD commit if not provided
  if (!commit) {
    const commits = await fetchGH<Commit[]>(
      ghToken,
      `/repos/${nameWithOwner}/commits`,
    );
    if (commits.length == 0) {
      throw new Error(`Found no commits for repository ${nameWithOwner}`);
    }
    commit = commits[0].sha;
  }
  console.log(`Commit: ${commit}`);

  console.log(`Annotations:`);
  const resp = await fetchGH<CheckRunsResponse>(
    ghToken,
    `/repos/${nameWithOwner}/commits/${commit}/check-runs`,
  );
  for (const run of resp.check_runs) {
    if (run.output.annotations_count > 0) {
      console.log(`  ${run.name}`);
      const annotations = await fetchGH<Annotation[]>(
        ghToken,
        `/repos/${nameWithOwner}/check-runs/${run.id}/annotations`,
      );
      for (const annotation of annotations) {
        console.log(`    ${annotation.title}:`);
        console.log(`      ${annotation.message}`);
      }
    }
  }
}

async function fetchGH<T>(token: string, path: string): Promise<T> {
  const url = `https://api.github.com${path}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (response.status != 200) {
    throw new Error(`GET ${url}: ${response.status}`);
  }
  return response.json() as unknown as T;
}

interface Commit {
  sha: string;
}

interface CheckRunsResponse {
  total_count: number;
  check_runs: CheckRun[];
}

interface CheckRun {
  id: number;
  name: string;
  output: {
    annotations_count: number;
  };
}

interface Annotation {
  title: string;
  message: string;
}

function usage(): void {
  console.log(`Usage: gha-list-annotations OWNER/REPO [COMMIT]`);
  Deno.exit(1);
}

await main();
