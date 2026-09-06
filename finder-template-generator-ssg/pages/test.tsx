// pages/about.tsx

import fs from "node:fs";
import path from "node:path";

export async function build() {
  const file = path.resolve("data/about.json");

  const json = fs.readFileSync(file, "utf8");

  const data = JSON.parse(json);

  return {
    title: data.title,
    users: data.users.map((user: any) => ({
      name: user.name,
      age: user.age,
    })),
  };
}

export default function Page(el: HTMLElement) {
  el.innerHTML = "<h1>About</h1>";
}
