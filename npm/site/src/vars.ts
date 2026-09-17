export const SERVER_ADRESS = "http://localhost:13420";

export let LINK_PREFIX = "/";

if (import.meta.env.mode === "static") {
  LINK_PREFIX = "/finder/";
}

export const isStatic =
  import.meta.env.MODE === "static" || import.meta.env.MODE === "staticroot";
