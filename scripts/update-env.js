#!/usr/bin/env node

/**
 * Update Environment Variables Script
 *
 * This script updates the .env file with ORM selection variables
 * for the Rice Bikes backend. It allows for easy toggling of repositories
 * between Prisma and Drizzle implementations.
 */

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const ENV_FILE_PATH = path.join(__dirname, "..", ".env");
const ENV_EXAMPLE_PATH = path.join(__dirname, "..", ".env.example");

// Define ORM selection environment variables
const ORM_VARIABLES = {
  USE_DRIZZLE: "Global switch for using Drizzle ORM instead of Prisma",
  DRIZZLE_USER_REPO: "Use Drizzle for User repository",
  DRIZZLE_TRANSACTION_REPO: "Use Drizzle for Transaction repository",
  DRIZZLE_CUSTOMER_REPO: "Use Drizzle for Customer repository",
  DRIZZLE_BIKE_REPO: "Use Drizzle for Bike repository",
  DRIZZLE_ITEM_REPO: "Use Drizzle for Item repository",
  DRIZZLE_REPAIR_REPO: "Use Drizzle for Repair repository",
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Read existing .env file content or create a new one
 */
function readEnvFile() {
  try {
    return fs.existsSync(ENV_FILE_PATH) ? fs.readFileSync(ENV_FILE_PATH, "utf8") : "";
  } catch (error) {
    console.error("Error reading .env file:", error);
    return "";
  }
}

/**
 * Parse .env file content into a map
 */
function parseEnvFile(content) {
  const envMap = new Map();

  if (!content) return envMap;

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envMap.set(key.trim(), value.trim());
      } else {
        // Keep comments and other lines as is
        envMap.set(line, null);
      }
    } else if (trimmedLine) {
      // Keep comments as is
      envMap.set(line, null);
    } else {
      // Keep empty lines
      envMap.set("", null);
    }
  }

  return envMap;
}

/**
 * Convert env map back to file content
 */
function envMapToString(envMap) {
  let result = "";

  for (const [key, value] of envMap.entries()) {
    if (value === null) {
      result += `${key}\n`;
    } else {
      result += `${key}=${value}\n`;
    }
  }

  return result;
}

/**
 * Update .env file with new variables
 */
function updateEnvFile(envMap) {
  let content = "";

  // Add ORM section header if it doesn't exist
  let hasOrmSection = false;
  for (const key of envMap.keys()) {
    if (key === "# ORM Selection") {
      hasOrmSection = true;
      break;
    }
  }

  if (!hasOrmSection) {
    envMap.set("\n# ORM Selection", null);
  }

  // Add or update ORM variables
  for (const [key, description] of Object.entries(ORM_VARIABLES)) {
    if (!envMap.has(key)) {
      envMap.set(key, "false");
    }
  }

  // Write to file
  content = envMapToString(envMap);
  fs.writeFileSync(ENV_FILE_PATH, content);
  console.log(`.env file updated successfully at ${ENV_FILE_PATH}`);

  // Update example file if it exists
  try {
    if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      const exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, "utf8");
      const exampleEnvMap = parseEnvFile(exampleContent);

      // Add ORM section header if it doesn't exist
      let hasExampleOrmSection = false;
      for (const key of exampleEnvMap.keys()) {
        if (key === "# ORM Selection") {
          hasExampleOrmSection = true;
          break;
        }
      }

      if (!hasExampleOrmSection) {
        exampleEnvMap.set("\n# ORM Selection", null);
      }

      // Add ORM variables to example
      for (const [key, description] of Object.entries(ORM_VARIABLES)) {
        if (!exampleEnvMap.has(key)) {
          exampleEnvMap.set(`${key}`, "false");
          exampleEnvMap.set(`# ${description}`, null);
        }
      }

      fs.writeFileSync(ENV_EXAMPLE_PATH, envMapToString(exampleEnvMap));
      console.log(`.env.example file updated successfully at ${ENV_EXAMPLE_PATH}`);
    }
  } catch (error) {
    console.error("Error updating .env.example file:", error);
  }
}

/**
 * Interactive mode: prompt user for each variable value
 */
async function runInteractiveMode(envMap) {
  console.log("\n=== ORM Selection Configuration ===");
  console.log("Set values for ORM selection variables (true/false):");

  // Prompt for each variable
  for (const [key, description] of Object.entries(ORM_VARIABLES)) {
    const currentValue = envMap.has(key) ? envMap.get(key) : "false";

    const answer = await new Promise((resolve) => {
      rl.question(`${key} (${description}) [${currentValue}]: `, (answer) => {
        resolve(answer || currentValue);
      });
    });

    envMap.set(key, answer.toLowerCase());
  }

  return envMap;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const interactive = args.includes("--interactive") || args.includes("-i");

  console.log("Updating .env file with ORM selection variables...");

  const content = readEnvFile();
  let envMap = parseEnvFile(content);

  if (interactive) {
    envMap = await runInteractiveMode(envMap);
  }

  updateEnvFile(envMap);

  if (interactive) {
    console.log("\nTo use these settings in your application, restart your server.");
  }

  rl.close();
}

// Run the script
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
