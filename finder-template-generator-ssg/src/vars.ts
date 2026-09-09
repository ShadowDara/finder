export const SERVER_ADRESS = "http://localhost:8080";

export let LINK_PREFIX = "/";

if (import.meta.env.mode === "static") {
  LINK_PREFIX = "/finder/";
}
