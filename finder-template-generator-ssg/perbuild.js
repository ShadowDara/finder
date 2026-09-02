import { copyFile } from "fs/promises";

await copyFile("./../CHANGELOG.md", "./docs/changelog.md");
