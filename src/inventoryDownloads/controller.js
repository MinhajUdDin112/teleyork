const express = require("express");
const Sim = require("../simInventory/model");
const { DateTime } = require("luxon");
exports.getInventory = async (req, res) => {
  try {
    const { startDate, endDate, billingModel, inventoryType, status } =
      req.body;

    // Checking if endDate is greater than the current date
    if (endDate) {
      const endDateTime = DateTime.fromISO(endDate).setZone("America/New_York");
      if (endDateTime > DateTime.now().setZone("America/New_York")) {
        return res
          .status(400)
          .json({ error: "endDate cannot be greater than current date" });
      }
    }

    let startDateTime, endDateTime;

    // If both start and end dates are provided, use them
    if (startDate && endDate) {
      startDateTime = DateTime.fromISO(startDate).setZone("America/New_York");
      endDateTime = DateTime.fromISO(endDate)
        .setZone("America/New_York")
        .endOf("day");
    } else {
      // Default to current day's data
      const now = DateTime.now().setZone("America/New_York");
      startDateTime = now.startOf("day");
      endDateTime = now.endOf("day");
    }

    // Find sims based on the provided criteria
    const sims = await Sim.find({
      billingModel: billingModel,
      unitType: inventoryType,
      status: status,
      CreatedAt: {
        $gte: startDateTime.toJSDate(),
        $lte: endDateTime.toJSDate(),
      },
    });
    console.log("sims", sims);
    // Map through the sims array to perform additional operations if needed
    const simsData = await Promise.all(
      sims.map(async (sim) => {
        const { billingModel, status, SimNumber, unitType } = sim;
        return {
          billingModel,
          status,
          esnNumber: SimNumber,
          InventoryType: unitType,
        };
      })
    );

    // Return the sims data
    res.json({ simsData, simsDataLength: simsData.length });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching inventory" });
  }
};
