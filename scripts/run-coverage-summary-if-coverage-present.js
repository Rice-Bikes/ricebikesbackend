#!/usr/bin/env node

/*
 run-coverage-summary-if-coverage-present.js

 Small, safe helper intended for use as a posttest step. It checks for a short,
 fixed list of well-known coverage artifact paths and, if any exist, invokes the
 compact coverage summary emitter (`scripts/emit-coverage-summary.js`).

 Behaviour:
  - If no known coverage artifacts are present: exits 0 and prints a short message.
  - If an artifact is present but the emitter is not found: prints a warning and exits 0.
  - If an artifact is present and the emitter runs: returns the emitter's exit code.
  - No repository-wide scans or regex searches are performed — only a small list
    of candidate paths is checked with fast existence checks.
*/

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CANDIDATES = [
  path.join("coverage", "coverage-summary.json"),
  path.join("coverage", "coverage-final.json"),
  path.join("coverage", "coverage.json"),
  path.join("coverage", "lcov.info"),
  path.join(".nyc_output", "out.json"),
  path.join(".nyc_output", "coverage.json"),
  "cov.json",
];

function artifactExists() {
  return CANDIDATES.some((rel) => {
    const p = path.resolve(process.cwd(), rel);
    try {
      return fs.statSync(p).isFile();
    } catch (err) {
      return false;
    }
  });
}

function findEmitter() {
  // Prefer the emitter in the same scripts directory as this helper
  const localEmitter = path.join(__dirname, "emit-coverage-summary.js");
  if (fs.existsSync(localEmitter) && fs.statSync(localEmitter).isFile()) {
    return localEmitter;
  }

  // Fallback: project-relative scripts directory
  const fallback = path.resolve(process.cwd(), "scripts", "emit-coverage-summary.js");
  if (fs.existsSync(fallback) && fs.statSync(fallback).isFile()) {
    return fallback;
  }

  return null;
}

function runEmitter(emitterPath) {
  const node = process.execPath;
  const args = [emitterPath];
  const opts = { stdio: "inherit", cwd: process.cwd() };

  const res = spawnSync(node, args, opts);
  if (res.error) {
    console.error("Failed to run coverage summary emitter:", res.error);
    return res.status || 1;
  }
  return res.status === null ? 0 : res.status;
}

function main() {
  try {
    if (!artifactExists()) {
      // Quiet success — nothing to do
      console.log("No coverage artifacts found; skipping coverage summary.");
      process.exit(0);
    }

    const emitter = findEmitter();
    if (!emitter) {
      console.warn("Coverage artifacts exist, but emitter not found at the expected locations.");
      console.warn("Checked: ./scripts/emit-coverage-summary.js and the script directory.");
      // Do not fail CI just because the emitter is missing; let upstream decide.
      process.exit(0);
    }

    console.log("Coverage artifacts detected — running compact coverage summary emitter...");
    const status = runEmitter(emitter);
    if (status === 0) {
      console.log("Compact coverage summary completed.");
      process.exit(0);
    } else {
      console.error("Coverage summary emitter exited with code", status);
      process.exit(status);
    }
  } catch (err) {
    console.error("Unexpected error while attempting to run coverage summary:", err?.message ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
