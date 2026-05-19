import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(new URL("./test-tsx-hooks.mjs", import.meta.url), {
  parentURL: pathToFileURL("./"),
});
