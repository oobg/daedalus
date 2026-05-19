import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export async function load(url, context, nextLoad) {
  if (!url.endsWith(".tsx")) {
    return nextLoad(url, context);
  }

  const ts = require("typescript");
  const filepath = fileURLToPath(url);
  const source = readFileSync(filepath, "utf8");

  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "react",
    },
    fileName: filepath,
  });

  return {
    format: "module",
    shortCircuit: true,
    source: result.outputText,
  };
}
