import { cp } from "fs/promises";

await cp("./dist", "./../cmd/findergen/frontend", { recursive: true });
