const { execFileSync } = require("node:child_process");
const { writeFileSync } = require("node:fs");

try {
  const lastTag = execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
    encoding: "utf8",
  }).trim();

  const format =
    "- _[%h](https://github.com/shadowdara/finder/tree/%H)_ %s%n%b";

  const commits = execFileSync(
    "git",
    ["log", `${lastTag}..HEAD`, "--no-merges", `--pretty=format:${format}`],
    { encoding: "utf8" },
  ).trim();

  const output =
    "# Newest Changes\n\n" +
    "<details>\n" +
    "<summary>Commits</summary>\n\n" +
    commits +
    "\n\n</details>\n";

  writeFileSync("Newest_Changes.md", output, "utf8");

  console.log("Changelog erstellt: Newest_Changes.md");
  console.log(`Seit Tag: ${lastTag}`);
} catch (error) {
  console.error("Fehler beim Erstellen des Changelogs:");
  console.error(error.message);
  process.exit(1);
}
