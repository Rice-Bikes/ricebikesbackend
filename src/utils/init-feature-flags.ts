/**
 * Feature Flag Initialization Script
 *
 * This script initializes the feature flags in the database.
 * It ensures that all required feature flags are created with default values.
 */

import { FeatureFlag, initializeFeatureFlags } from "./feature-flags";

async function main() {
  console.log("🚩 Initializing feature flags...");

  try {
    // Initialize default feature flags
    await initializeFeatureFlags("system");

    console.log("✅ Feature flags initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing feature flags:", error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Unhandled error:", error);
      process.exit(1);
    });
}

export default main;
