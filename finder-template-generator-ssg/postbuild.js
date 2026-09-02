import { rm, cp } from "fs/promises";

await rm("./../cmd/findergen/frontend", {
  recursive: true,
  force: true,
});

await cp("./dist", "./../cmd/findergen/frontend", {
  recursive: true,
});
