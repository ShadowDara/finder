const { execSync } = require("node:child_process");
const { writeFileSync } = require("node:fs");

try {
  const lastTag = execSync("git describe --tags --abbrev=0", {
    encoding: "utf8",
  }).trim();

  const command = `git log ${lastTag}..HEAD --no-merges --pretty=format:"- _[%h](https://github.com/shadowdara/finder/tree/%H)_ %s%n%b"`;

  const output =
    "# Newest Changes \n\n" +
    execSync(command, {
      encoding: "utf8",
    }).trim();

  writeFileSync("Newest_Changes.md", output + "\n", "utf8");

  console.log(`Changelog erstellt: Newest_Changes.md`);
  console.log(`Seit Tag: ${lastTag}`);
} catch (error) {
  console.error("Fehler beim Erstellen des Changelogs:");
  console.error(error.message);
  process.exit(1);
}
