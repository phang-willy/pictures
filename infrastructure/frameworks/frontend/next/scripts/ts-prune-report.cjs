/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("node:child_process");

const ignorePattern =
  "^[A-Za-z]:\\\\|[\\\\/]\\.next[\\\\/]|[\\\\/]src[\\\\/]components[\\\\/]ui[\\\\/]";

let rawOutput = "";
try {
  rawOutput = execSync(`npx ts-prune -i "${ignorePattern}"`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  if (typeof error?.stdout === "string") {
    rawOutput = error.stdout;
  } else {
    rawOutput = String(error?.stdout || "");
  }
}

rawOutput = rawOutput.replace(/\r/g, "");
const lines = rawOutput
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !/\\next\.config\.ts:/.test(line));

let good = 0;
let warn = 0;
let bad = 0;
const grouped = {
  good: [],
  warn: [],
  bad: [],
};

const isFrameworkSafe = (line) =>
  /\\src\\proxy\.ts:\d+\s-\s(proxy|config)$/.test(line) ||
  /\\src\\app\\.*:\d+\s-\s(default|metadata|generateMetadata)$/.test(line);

const isWarn = (line) => /\(used in module\)$/.test(line);
const filePathOf = (line) => line.split(":")[0] || line;
const color = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

for (const line of lines) {
  if (isFrameworkSafe(line)) {
    good += 1;
    grouped.good.push(line);
    continue;
  }

  if (isWarn(line)) {
    warn += 1;
    grouped.warn.push(line);
    continue;
  }

  bad += 1;
  grouped.bad.push(line);
}

grouped.good.sort((a, b) => filePathOf(a).localeCompare(filePathOf(b)));
grouped.warn.sort((a, b) => filePathOf(a).localeCompare(filePathOf(b)));
grouped.bad.sort((a, b) => filePathOf(a).localeCompare(filePathOf(b)));

for (const line of grouped.good) {
  console.log(`${color.green}[good]${color.reset} ${line}`);
}
for (const line of grouped.warn) {
  console.log(`${color.yellow}[warn]${color.reset} ${line}`);
}
for (const line of grouped.bad) {
  console.log(`${color.red}[bad]${color.reset}  ${line}`);
}

console.log("");
console.log(
  `${color.green}good${color.reset}/${color.yellow}warn${color.reset}/${color.red}bad${color.reset} ${good}/${warn}/${bad}`,
);

process.exit(0);
