#!/usr/bin/env node

/*
emit-coverage-summary.js

Reads a coverage artifact safely and emits a small JSON summary at:
 - coverage/summary.json
 - coverage-summary.json

Behavior:
 - Checks a short list of candidate files (no repo-wide scanning).
 - If the selected file is small (<= 128KiB), reads the whole file and tries:
    * parse as JSON and extract `total.*.pct` or compute pct from covered/total
    * fall back to parsing an ASCII "All files" table if present
    * fall back to finding a JSON `total` snippet anywhere and parse it
 - If the file is large, reads only the tail (64KiB) and tries the ASCII / embedded-JSON approaches.
 - Exits non-zero with helpful messages if nothing recognized.

This script is intentionally conservative to avoid loading large files into memory.
*/

const fs = require("node:fs");
const path = require("node:path");

// Candidate coverage artifacts (checked in order, stop at first match)
const CANDIDATES = [
  path.join("coverage", "coverage-summary.json"),
  path.join("coverage", "coverage-final.json"),
  path.join("coverage", "coverage.json"),
  path.join("coverage", "lcov.info"),
  path.join(".nyc_output", "out.json"),
  path.join(".nyc_output", "coverage.json"),
  "cov.json",
];

const TAIL_BYTES = 64 * 1024; // 64 KiB
const SMALL_FILE_THRESHOLD = 128 * 1024; // 128 KiB

function findExistingFiles() {
  const found = [];
  for (const rel of CANDIDATES) {
    const p = path.resolve(process.cwd(), rel);
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) found.push(p);
    } catch (err) {
      // ignore and continue
    }
  }
  return found;
}

function readTailSync(filepath, bytes = TAIL_BYTES) {
  const fd = fs.openSync(filepath, "r");
  try {
    const stat = fs.fstatSync(fd);
    const size = stat.size;
    const readBytes = Math.min(bytes, size);
    const start = Math.max(0, size - readBytes);
    const buffer = Buffer.alloc(readBytes);
    fs.readSync(fd, buffer, 0, readBytes, start);
    return buffer.toString("utf8");
  } finally {
    fs.closeSync(fd);
  }
}

function parseAsciiAllFiles(text) {
  // Matches:
  // All files          |   31.92 |    30.53 |   29.84 |   31.56 |
  const re = /^All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/m;
  const m = text.match(re);
  if (!m) return null;
  const [, statements, branches, funcs, lines] = m;
  return {
    statements: Number.parseFloat(statements),
    branches: Number.parseFloat(branches),
    functions: Number.parseFloat(funcs),
    lines: Number.parseFloat(lines),
    raw_line: m[0].trim(),
  };
}

function computePctFromCoveredTotal(obj) {
  // obj might be { total: n, covered: m } or { covered, total } sometimes with nested shapes
  if (!obj || typeof obj !== "object") return null;
  const covered = obj.covered ?? obj.coveredCount ?? obj.covered_lines ?? obj.coveredLines;
  const total = obj.total ?? obj.totalCount ?? obj.total_lines ?? obj.totalLines;
  if (typeof covered === "number" && typeof total === "number" && total > 0) {
    return (covered / total) * 100;
  }
  return null;
}

function pctFromField(fieldOrValue) {
  if (fieldOrValue == null) return null;
  if (typeof fieldOrValue === "number") return fieldOrValue;
  if (typeof fieldOrValue === "object") {
    if (typeof fieldOrValue.pct === "number") return fieldOrValue.pct;
    if (typeof fieldOrValue.percent === "number") return fieldOrValue.percent;
    const computed = computePctFromCoveredTotal(fieldOrValue);
    if (computed != null) return computed;
  }
  const parsed = Number.parseFloat(String(fieldOrValue));
  if (!Number.isNaN(parsed)) return parsed;
  return null;
}

function extractJsonTotalFromText(text) {
  // Find last occurrence of '"total"' and attempt to JSON-parse a balanced object containing it.
  const key = '"total"';
  const idx = text.lastIndexOf(key);
  if (idx === -1) return null;

  // Find a '{' before idx
  let start = text.lastIndexOf("{", idx);
  if (start === -1) start = 0;

  // Find a matching closing brace
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;

  const candidate = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    const total = parsed.total || parsed;
    if (!total || typeof total !== "object") return null;
    const statements = pctFromField(total.statements);
    const branches = pctFromField(total.branches);
    const functions = pctFromField(total.functions);
    const lines = pctFromField(total.lines);
    const hasAny = [statements, branches, functions, lines].some((v) => typeof v === "number");
    if (!hasAny) return null;
    const result = {};
    if (typeof statements === "number") result.statements = statements;
    if (typeof branches === "number") result.branches = branches;
    if (typeof functions === "number") result.functions = functions;
    if (typeof lines === "number") result.lines = lines;
    return { ...result, raw_json_excerpt: candidate.slice(0, 1000) };
  } catch (e) {
    return null;
  }
}

function parseLcovInfo(text) {
  // Minimal lcov parser to compute overall lines coverage percentage.
  // Not a full-fledged parser; we only compute total lines & covered lines.
  let totalLines = 0;
  let coveredLines = 0;
  // lines like: DA:<line number>,<execution count>
  const lines = text.split(/\r?\n/);
  for (const ln of lines) {
    if (ln.startsWith("DA:")) {
      const parts = ln.slice(3).split(",");
      if (parts.length >= 2) {
        const total = 1;
        const hits = Number.parseInt(parts[1], 10);
        totalLines += total;
        if (!Number.isNaN(hits) && hits > 0) coveredLines += 1;
      }
    }
  }
  if (totalLines === 0) return null;
  return { lines: (coveredLines / totalLines) * 100 };
}

function writeSummaryToFiles(summary, sourceFile) {
  const out = {
    summary_source: sourceFile ? path.relative(process.cwd(), sourceFile) : undefined,
    generated_at: new Date().toISOString(),
    ...summary,
  };

  const coverageDir = path.join(process.cwd(), "coverage");
  try {
    if (!fs.existsSync(coverageDir)) fs.mkdirSync(coverageDir, { recursive: true });
    const outPath = path.join(coverageDir, "summary.json");
    fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  } catch (err) {
    throw new Error(`Failed to write coverage/summary.json: ${err.message}`);
  }

  // also write root-level compatibility file
  try {
    const rootPath = path.join(process.cwd(), "coverage-summary.json");
    fs.writeFileSync(rootPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  } catch (err) {
    throw new Error(`Failed to write coverage-summary.json: ${err.message}`);
  }
}

function fail(msg, code = 1) {
  console.error(`emit-coverage-summary: ${msg}`);
  process.exit(code);
}

function attemptParseFileFully(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // If JSON-like, try parse whole JSON
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(content);
        const total = parsed.total || parsed;
        if (total && typeof total === "object") {
          const statements = pctFromField(total.statements);
          const branches = pctFromField(total.branches);
          const functions = pctFromField(total.functions);
          const lines = pctFromField(total.lines);
          const hasAny = [statements, branches, functions, lines].some((v) => typeof v === "number");
          if (hasAny) {
            const summary = {};
            if (typeof statements === "number") summary.statements = statements;
            if (typeof branches === "number") summary.branches = branches;
            if (typeof functions === "number") summary.functions = functions;
            if (typeof lines === "number") summary.lines = lines;
            return summary;
          }
        }
      } catch (e) {
        // not valid full JSON, continue to other heuristics
      }
    }

    // Try ASCII table in the entire content
    const ascii = parseAsciiAllFiles(content);
    if (ascii) return ascii;

    // Try to find JSON 'total' snippet anywhere
    const snippet = extractJsonTotalFromText(content);
    if (snippet) return snippet;

    // Try a basic lcov parse if the file looks like lcov (contains 'DA:' lines)
    if (content.includes("DA:")) {
      const lcovSummary = parseLcovInfo(content);
      if (lcovSummary) return lcovSummary;
    }

    return null;
  } catch (err) {
    throw new Error(`Failed to read ${filePath}: ${err.message}`);
  }
}

function attemptParseFileTail(filePath) {
  const tail = readTailSync(filePath, TAIL_BYTES);

  // ASCII table
  const ascii = parseAsciiAllFiles(tail);
  if (ascii) return ascii;

  // Embedded JSON total
  const snippet = extractJsonTotalFromText(tail);
  if (snippet) return snippet;

  // If the file is lcov and tail contains DA: lines, try a tiny lcov parse
  if (tail.includes("DA:")) {
    const lcovSummary = parseLcovInfo(tail);
    if (lcovSummary) return lcovSummary;
  }

  return null;
}

function main() {
  const files = findExistingFiles();
  if (!files || files.length === 0) fail(`No coverage artifact found. Checked: ${CANDIDATES.join(", ")}`, 2);

  let parsed = null;
  let source = null;

  for (const file of files) {
    let stat;
    try {
      stat = fs.statSync(file);
    } catch (err) {
      // Can't stat this candidate, skip it
      continue;
    }

    let parsedCandidate = null;
    try {
      if (stat.size <= SMALL_FILE_THRESHOLD) {
        parsedCandidate = attemptParseFileFully(file);
      } else {
        parsedCandidate = attemptParseFileTail(file);
      }

      // If nothing found yet, try tail parsing as a fallback for robustness
      if (!parsedCandidate) parsedCandidate = attemptParseFileTail(file);
    } catch (err) {
      // Problem parsing this candidate; skip to the next one
      continue;
    }

    if (parsedCandidate) {
      parsed = parsedCandidate;
      source = file;
      break;
    }
  }

  if (!parsed) {
    fail(
      `Couldn't find a compact coverage summary in any candidate files (${files
        .map((f) => path.relative(process.cwd(), f))
        .join(
          ", ",
        )}). If you use nyc you can generate a small JSON summary via: 'nyc report --reporter=json-summary' or ensure that 'coverage/coverage-summary.json' exists.`,
      4,
    );
  }

  // Normalize the parsed object to the expected output shape
  const summary = {};
  if (typeof parsed.statements === "number") summary.statements = parsed.statements;
  if (typeof parsed.branches === "number") summary.branches = parsed.branches;
  if (typeof parsed.functions === "number") summary.functions = parsed.functions;
  if (typeof parsed.lines === "number") summary.lines = parsed.lines;

  try {
    writeSummaryToFiles(summary, source);
    console.log(`Wrote compact coverage summary (source: ${path.relative(process.cwd(), source)})`);
    process.exit(0);
  } catch (err) {
    fail(err.message, 5);
  }
}

if (require.main === module) {
  main();
}
