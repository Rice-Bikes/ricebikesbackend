#!/usr/bin/env -S node
/**
 * scripts/check-routers-imports.ts
 *
 * Lightweight helper script for validating that the modules referenced by
 * the `routersImport.test.ts` smoke-test can be imported without throwing.
 *
 * Usage:
 *   # Default: reads the module list from the test file and attempts to import
 *   # each one. Exits with code 1 if any import fails.
 *   npx tsx scripts/check-routers-imports.ts
 *
 * Options:
 *   --source <path>    Path to the test file containing the `modules` array.
 *                      Default: src/api/healthCheck/__tests__/routersImport.test.ts
 *   --timeout <ms>     Per-module import timeout in ms. Default: 20000
 *   --show-stack       When present, prints full stack traces for failures.
 *   --auto             Skip reading the test file and instead scan for all
 *                      files under `src` whose filename ends with `Router.ts`.
 *   --help             Print usage
 *
 * Notes:
 *   - The script resolves specifiers found in the test file relative to the
 *     test file directory (same approach the test uses).
 *   - This script intentionally keeps behavior conservative: it only attempts
 *     to import the modules listed in the test (or router files under `src` if
 *     `--auto` is used). That reduces noise from unrelated files that may need
 *     DB/ENV setup.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type Result = {
  specifier: string;
  filePath?: string;
  ok: boolean;
  timeout?: boolean;
  error?: any;
};

const DEFAULT_TEST_PATH = path.join("src", "api", "healthCheck", "__tests__", "routersImport.test.ts");

function printUsage() {
  console.log(`
check-routers-imports

Usage:
  npx tsx scripts/check-routers-imports.ts [--source <path>] [--timeout <ms>] [--show-stack] [--auto] [--help]

Options:
  --source <path>    Path to the test file containing the modules array.
                     Default: ${DEFAULT_TEST_PATH}
  --timeout <ms>     Per-module import timeout in ms. Default: 20000
  --show-stack       When present, prints full stack traces for failures.
  --auto             Scan for router files under src/**/*Router.ts instead of reading the test file.
  --help             Print this message
`);
}

function parseArgs(argv: string[]) {
  const out: Record<string, any> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      out.help = true;
    } else if (a === "--source") {
      out.source = argv[++i];
    } else if (a === "--timeout") {
      out.timeout = Number(argv[++i]);
    } else if (a === "--show-stack") {
      out.showStack = true;
    } else if (a === "--auto") {
      out.auto = true;
    }
  }
  return out;
}

async function parseModulesFromTestFile(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const arrayRe = /const\s+modules\s*=\s*\[((?:\s|.)*?)\];/m;
  const match = arrayRe.exec(content);
  if (!match) return [];
  const arrayContent = match[1];
  const stringRe = /['"]([^'"]+)['"]/g;
  const modules: string[] = [];
  let m: RegExpExecArray | null = stringRe.exec(arrayContent);
  while (m !== null) {
    modules.push(m[1]);
    m = stringRe.exec(arrayContent);
  }
  return modules;
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveSpecifierToFilePath(baseDir: string, specifier: string): Promise<string | null> {
  // Try common options:
  // 1) specifier + .ts (relative to baseDir)
  // 2) specifier as given (maybe includes extension)
  // 3) specifier as index: specifier/index.ts
  const candidates: string[] = [];

  if (specifier.startsWith(".")) {
    candidates.push(path.resolve(baseDir, `${specifier}.ts`));
    candidates.push(path.resolve(baseDir, specifier));
    candidates.push(path.resolve(baseDir, specifier, "index.ts"));
  } else if (specifier.startsWith("/")) {
    // absolute-ish: try as is with .ts
    candidates.push(path.resolve(`${specifier}.ts`));
    candidates.push(path.resolve(specifier));
    candidates.push(path.resolve(specifier, "index.ts"));
  } else {
    // treat as relative to baseDir (same as the test file does)
    candidates.push(path.resolve(baseDir, `${specifier}.ts`));
    candidates.push(path.resolve(baseDir, specifier));
    candidates.push(path.resolve(baseDir, specifier, "index.ts"));
  }

  for (const c of candidates) {
    if (await fileExists(c)) return c;
  }

  return null;
}

async function importWithTimeout(fileUrl: string, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise((res) => {
    timer = setTimeout(
      () =>
        res({
          ok: false,
          timeout: true,
          error: new Error(`Import timed out after ${ms}ms`),
        }),
      ms,
    );
  });

  const p = Promise.race([
    (async () => {
      try {
        const mod = await import(fileUrl);
        return { ok: true, module: mod };
      } catch (err) {
        return { ok: false, error: err };
      }
    })(),
    timeoutPromise,
  ]) as Promise<any>;

  try {
    const r = await p;
    return r;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function findRouterFilesUnderSrc(): Promise<string[]> {
  const root = path.resolve("src");
  const out: string[] = [];
  async function walk(dir: string) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.name === "__tests__") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith("Router.ts")) {
        out.push(full);
      }
    }
  }
  try {
    await walk(root);
  } catch (err) {
    // ignore
  }
  return out.sort();
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  const timeout = typeof args.timeout === "number" && !Number.isNaN(args.timeout) ? args.timeout : 20000;
  const showStack = !!args.showStack;
  const auto = !!args.auto;
  const source = args.source ?? DEFAULT_TEST_PATH;

  console.log(`check-routers-imports
  source: ${auto ? "(auto scan under src)" : source}
  timeout: ${timeout}ms
  showStack: ${showStack}
`);

  let specifiers: string[] = [];
  const baseDir = path.dirname(path.resolve(source));

  if (auto) {
    const files = await findRouterFilesUnderSrc();
    if (files.length === 0) {
      console.error("No router files found under src (files matching '*Router.ts').");
      process.exit(2);
    }
    specifiers = files.map((f) => path.relative(process.cwd(), f));
  } else {
    try {
      const modules = await parseModulesFromTestFile(path.resolve(source));
      if (modules.length === 0) {
        console.error(`No modules found in test file ${source}. Did the format change?`);
        console.error("Try running with --auto to scan for router files under src.");
        process.exit(2);
      }
      specifiers = modules;
    } catch (err: any) {
      console.error(`Failed to read/parse test file ${source}: ${err?.message ?? String(err)}`);
      process.exit(2);
    }
  }

  const results: Result[] = [];

  for (const spec of specifiers) {
    try {
      let resolvedPath: string | null = null;
      // If auto-scan returned actual file paths, use them directly.
      if (path.isAbsolute(spec) || spec.startsWith(".") || spec.startsWith("/")) {
        // Resolve relative specifiers relative to baseDir (same as tests)
        resolvedPath = await resolveSpecifierToFilePath(baseDir, spec);
      } else if (spec.includes("/") || spec.includes("\\")) {
        // contains a path: resolve relative to baseDir (the test file dir)
        resolvedPath = await resolveSpecifierToFilePath(baseDir, spec);
      }

      // If we couldn't resolve to a path, but spec might already be a relative path (auto mode)
      if (!resolvedPath) {
        // try it as a file directly (maybe auto mode gave us the path relative to cwd)
        const tryPath = path.resolve(spec);
        if (await fileExists(tryPath)) resolvedPath = tryPath;
      }

      if (!resolvedPath) {
        // Last-ditch: try resolving as a TS module relative to project root
        const tryPathRoot = path.resolve(process.cwd(), `${spec}.ts`);
        if (await fileExists(tryPathRoot)) resolvedPath = tryPathRoot;
      }

      if (!resolvedPath) {
        // report as not found
        results.push({
          specifier: spec,
          ok: false,
          error: new Error("File not found"),
        });
        console.error(`NOT FOUND: ${spec}`);
        continue;
      }

      const fileUrl = pathToFileURL(resolvedPath).href;
      process.stdout.write(`IMPORTING: ${spec} -> ${resolvedPath} ... `);
      const r = await importWithTimeout(fileUrl, timeout);
      if (r.ok) {
        console.log("OK");
        results.push({ specifier: spec, filePath: resolvedPath, ok: true });
      } else {
        const err = r.error ?? new Error("Unknown error");
        console.log("FAILED");
        results.push({
          specifier: spec,
          filePath: resolvedPath,
          ok: false,
          timeout: !!r.timeout,
          error: err,
        });
        if (showStack) {
          console.error(err?.stack ?? err?.message ?? String(err));
        } else {
          console.error(err?.message ?? String(err));
        }
      }
    } catch (err: any) {
      console.log("FAILED");
      results.push({ specifier: spec, ok: false, error: err });
      if (showStack) {
        console.error(err?.stack ?? err?.message ?? String(err));
      } else {
        console.error(err?.message ?? String(err));
      }
    }
  }

  const total = results.length;
  const failed = results.filter((r) => !r.ok);
  const succeeded = results.filter((r) => r.ok);

  console.log(`
Summary:
  total:    ${total}
  succeeded:${succeeded.length}
  failed:   ${failed.length}
`);

  if (failed.length > 0) {
    console.log("Failed modules:");
    for (const f of failed) {
      const reason = f.timeout ? "timed out" : (f.error?.message ?? String(f.error));
      console.log(` - ${f.specifier} (${f.filePath ?? "n/a"}): ${reason}`);
    }
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (import.meta.main) {
  run().catch((err) => {
    console.error("Unexpected error:", err?.stack ?? err?.message ?? String(err));
    process.exit(2);
  });
}
