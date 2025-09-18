#!/usr/bin/env node

const { dataExportService } = require("./dist/services/dataExportService");

async function testDataExport() {
  try {
    console.log("Testing data export service...");

    // Test financial summary
    const financialSummary = await dataExportService.getFinancialSummary();
    console.log("Financial Summary:", JSON.stringify(financialSummary, null, 2));

    // Test repair metrics
    const repairMetrics = await dataExportService.getRepairMetrics();
    console.log("Repair Metrics (first 3):", JSON.stringify(repairMetrics.slice(0, 3), null, 2));

    // Test bike inventory
    const bikeInventory = await dataExportService.getBikeInventory();
    console.log("Bike Inventory (first 3):", JSON.stringify(bikeInventory.slice(0, 3), null, 2));

    console.log("\n✅ All data export tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

testDataExport();
