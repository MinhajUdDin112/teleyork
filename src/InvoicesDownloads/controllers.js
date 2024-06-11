const express = require("express");
const user = require("../adminUser/adminUserModel");
const Invoice = require("../invoices/invoicemodel");
const cust = require("../user/model");
const { DateTime } = require("luxon");

exports.invoices = async (req, res) => {
  try {
    let { startDate, endDate, billingModel, role } = req.body;

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

    const users = await user.find({ role: { $in: role } });
    console.log("user", users);
    const usersData = await Promise.all(
      users.map(async (user) => {
        console.log(user);
        const customers = await cust.find({
          createdBy: user._id,
          accountType: billingModel,
          createdAt: {
            $gte: startDateTime.toJSDate(),
            $lte: endDateTime.toJSDate(),
          },
        });

        const customerData = await Promise.all(
          customers.map(async (customer) => {
            const invoices = await Invoice.find({
              customerId: customer._id,
              createdAt: {
                $gte: startDateTime.toJSDate(),
                $lte: endDateTime.toJSDate(),
              },
            });

            console.log("Invoices length for customer:", invoices.length);

            return {
              customer,
              invoices,
              invoiceCount: invoices.length,
            };
          })
        );

        return {
          user,
          customers: customerData,
        };
      })
    );

    console.log(usersData);
    res.json(usersData); // Sending the data as JSON response
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching invoices" });
  }
};
