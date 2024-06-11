"use strict";
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const invoice = express.Router();
const AppError = require("../helpers/apiError");
const expressAsyncHandler = require("express-async-handler");
const invoicemodel = require("../invoices/invoicemodel");
const { mode } = require("crypto-js");
const cron = require("node-cron");
const CustModel = require("../user/model");
const planModel = require("../plan/model.js");
const billingModel = require("../billing/billingModel.js");
const { DateTime } = require("luxon");
const ClientGatewayCredential = require("../paymentMethod/model");
var ApiContracts = require("authorizenet").APIContracts;
var ApiControllers = require("authorizenet").APIControllers;
var SDKConstants = require("authorizenet").Constants;
const billingServices = require("../billing/billingServices.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

invoice.post("/invoices", async (req, res) => {
  try {
    const {
      customerid,
      plan,
      stripeId,
      totalAmount,
      status,
      billingPeriod,
      discount,
      additionalFeature,
      billId,
      type,
    } = req.body;
    // Validate required fields
    // if (!customerid || !plan || !totalAmount || !billId) {
    //     return res.status(400).json({ success: false, message: 'Missing required fields.' });
    //   }

    //   // Validate data types
    //   if (typeof totalAmount !== 'string' || typeof status !== 'string' || typeof billingPeriod !== 'string') {
    //     return res.status(400).json({ success: false, message: 'Invalid data types for fields.' });
    //   }

    const newInvoice = new invoicemodel({
      plan,
      stripeId,
      totalAmount,
      status,
      billingPeriod,
      discount,
      additionalFeature,
      billId,
      type,
    });

    // Save the new invoice
    const savedInvoice = await newInvoice.save();
    if (savedInvoice) {
      const customer = await CustModel.findOneAndUpdate(
        { _id: customerid },
        { $push: { invoice: savedInvoice._id }, plan: plan, billID: billId },
        { new: true } // Optional: This ensures the updated document is returned
      );
    }
    res.status(201).json({ success: true, data: savedInvoice });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
invoice.get("/getCustomerByBillID", async (req, res) => {
  try {
    const { billID } = req.query;

    // Use findOne with the 'billID' field to find a customer with the specified bill ID
    const customer = await CustModel.findOne({ billID: billID })
      .select("plan billID") // Include both 'plan' and 'billID' in the response
      .populate({
        path: "plan",
        select:
          "name description type dataAllowance dataAllowanceUnit voiceAllowance voiceAllowanceUnit textAllowance textAllowanceUnit duration durationUnit price additionalFeatures termsAndConditions restrictions active planId",
      })
      .populate({
        path: "billID",
        select: "additionalFeature selectdiscount monthlyCharge",
        populate: [
          { path: "additionalFeature", select: "featureName featureAmount" },
          { path: "selectdiscount", select: "_id discountname amount" },
          { path: "monthlyCharge", select: "name" },
        ],
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found for the provided bill ID.",
      });
    }

    // Return the found customer with both 'plan' and 'billID'
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Error fetching customer by bill ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

invoice.get("/getinvoicebyid", async (req, res) => {
  try {
    const { invoiceId } = req.query;

    // Validate if invoiceId is provided
    if (!invoiceId) {
      return res
        .status(400)
        .json({ success: false, message: "Invoice ID is required." });
    }

    // Find the invoice by ID
    const foundInvoice = await invoicemodel
      .findById(invoiceId)
      .populate("discount", "discountname  amount")
      .populate("plan", "name description price")
      .populate("additionalFeature", "featureName featureAmount")
      .populate("billId", "inventoryType");
    // Check if the invoice exists
    if (!foundInvoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found." });
    }

    // Return the found invoice
    res.status(200).json({ success: true, data: foundInvoice });
  } catch (error) {
    console.error("Error fetching invoice by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
invoice.get("/getinvoicebycustomerid", async (req, res) => {
  try {
    const { customerid } = req.query;

    // Validate if customerid is provided
    if (!customerid) {
      return res
        .status(400)
        .json({ success: false, message: "Customer ID is required." });
    }

    // Find the customer by ID
    const foundCustomer = await CustModel.findById(customerid)
      .populate({
        path: "invoice",
        populate: [
          // Fields from the Invoice model
          { path: "discount", select: "name amount" },
          { path: "additionalCharges", select: "name amount" },
          "invoiceNo",
          "stripeId",
          "invoiceType",
          "planCharges",
          "totalAmount",
          "amountPaid",
          "invoiceCreateDate",
          "invoiceDueDate",
          "billingPeriod.from",
          "billingPeriod.to",
          "invoiceStatus",
          "invoicePaymentMethod",
          "invoiceOneTimeCharges",
          "lateFee",
          "planId",
          "netPrice",
          // Add paths for any other nested structures or fields you want to populate
        ],
      })
      .populate({
        path: "adHocInvoice",
        populate: [
          "invoiceNo",
          "stripeId",
          "invoiceType",
          "planCharges",
          "totalAmount",
          "amountPaid",
          "invoiceCreateDate",
          "invoiceDueDate",
          "billingPeriod.from",
          "billingPeriod.to",
          "invoiceStatus",
          "invoicePaymentMethod",
          "invoiceOneTimeCharges",
          "lateFee",
          "planId",
          "netPrice",
          // Add paths for any other nested structures or fields you want to populate
        ],
      })
      .sort({ createdAt: -1 });

    // Check if the customer exists
    if (!foundCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    // Merge invoice and adHocInvoice arrays
    const allInvoices = [
      ...foundCustomer.invoice,
      ...foundCustomer.adHocInvoice,
    ];

    // Sort the merged array based on createdAt field
    allInvoices.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Return the sorted array in the response data
    res.status(200).json({ success: true, data: allInvoices });
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
invoice.post("/prepaidgenerateInvoice", async (req, res) => {
  try {
    // Extract required data from the request
    let {
      customerId,
      planId,
      stripeId,
      accountId,
      invoiceType,
      planCharges,
      additionalCharges,
      discount,
      totalAmount,
      amountPaid,
      invoiceDueDate,
      billingPeriod,
      invoiceStatus,
      invoicePaymentMethod,
      invoiceOneTimeCharges,
      lateFee,
      chargingType,
      printSetting,
      planName,
      paymentChannel,
      selectProduct,
      isInvoice,
      isAutopay,
      autopayId,
      autopayChargeDate,
      stripeTokenId,
      stripeCustomerId,
      isWithInvoice,
      isWithoutInvoice,
      paymentId,
    } = req.body;

    // Retrieve customer details using the provided customerId
    let customer = await CustModel.findOne({ _id: customerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found with the provided customerId.",
      });
    }
    let Product = await billingServices.getById(selectProduct);
    let wallet;
    if (amountPaid > totalAmount) {
      wallet = 0;
      wallet = amountPaid - totalAmount;
      amountPaid = totalAmount;
      console.log(wallet, amountPaid);
    }
    // Calculate total additional charges
    let totalAdditionalCharges = 0;
    req.body.additionalCharges.forEach((charge) => {
      totalAdditionalCharges += parseFloat(charge.amount);
    });

    // Calculate total discount
    let totalDiscount = 0;
    req.body.discount.forEach((discount) => {
      totalDiscount += parseFloat(discount.amount);
    });

    // Retrieve plan details
    const plan = await planModel.findById(planId);

    // Calculate net amount
    // let netAmount =
    //   totalAdditionalCharges +
    //   parseFloat(plan.price) -
    //   totalDiscount +
    //   parseFloat(invoiceOneTimeCharges) -
    //   parseFloat(amountPaid);

    let netAmount = totalAdditionalCharges + parseFloat(plan.price);
    let recurringCharges = netAmount - totalDiscount;
    netAmount = recurringCharges + parseFloat(invoiceOneTimeCharges);
    netAmount -= parseFloat(amountPaid);

    // Generate invoice number with year, month, and accountId
    const currentDate = DateTime.now().setZone("America/New_York");
    const currentYear = currentDate.toFormat("yyyy");
    const currentMonth = currentDate.toFormat("LL");
    const invoiceNo = `${currentYear}-${currentMonth}-${customer.accountId}`;

    // Calculate due date
    // Calculate due date
    let dueDate;
    if (invoiceStatus === "Paid") {
      // If invoice status is "Paid", set due date as createdAt
      let dueDates = currentDate.plus({
        days: invoiceDueDate,
      });
      dueDate = dueDates.toJSDate(); // Convert to Date object
    } else if (invoiceStatus === "Partial") {
      // If invoice status is "Partial", add invoiceDueDate days to createdAt
      let dueDates = currentDate.plus({
        days: invoiceDueDate,
      });
      dueDate = dueDates.toJSDate(); // Convert to Date object
    } else {
      // If invoice status is not specified, set due date as invoiceDueDate
      let dueDates = currentDate.plus({
        days: invoiceDueDate,
      });
      dueDate = dueDates.toJSDate(); // Convert to Date object
    }

    const billingPeriodFrom = currentDate.toFormat("MM-dd-yyyy");
    const billingPeriodTo = currentDate
      .plus({ days: 30 })
      .toFormat("MM-dd-yyyy");
    // Format the dueDate as MM-DD-YYYY
    const formattedDueDate = `${(dueDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${dueDate
      .getDate()
      .toString()
      .padStart(2, "0")}-${dueDate.getFullYear()}`;
    let updatedAutopayChargeDate;
    if (isAutopay === true) {
      autopayChargeDate = parseInt(autopayChargeDate);
      // Calculate the next month's date based on the provided autopayChargeDate
      const currentDate = DateTime.now().setZone("America/New_York");
      const nextMonthDate = currentDate.plus({ months: 1 });
      const nextMonth = nextMonthDate.month;
      const nextMonthYear = nextMonthDate.year;
      console.log("in autopay", currentDate.day, autopayChargeDate);
      // Check if the current date is after the autopay date
      if (currentDate.day > autopayChargeDate) {
        console.log("in autopay after");
        // If current date is after the autopay date, advance to the next month
        const nextMonthDate = DateTime.local(
          nextMonthYear,
          nextMonth + 1,
          autopayChargeDate
        );
        updatedAutopayChargeDate = nextMonthDate.toFormat("MM-dd-yyyy"); // Format autopayChargeDate as 'dd'
        console.log(`Updated autopayChargeDate to ${updatedAutopayChargeDate}`);
      }
    }
    let savedInvoice;
    if (isInvoice === true) {
      console.log("Saved Invoice");
      // Create a new invoice document
      const newInvoice = new invoicemodel({
        invoiceNo,
        invoiceType,
        planCharges: plan.price,
        discount,
        additionalCharges,
        invoiceOneTimeCharges: parseFloat(invoiceOneTimeCharges),
        totalAmount,
        amountPaid,
        invoiceDueDate: formattedDueDate,
        billingPeriod: {
          from: billingPeriodFrom,
          to: billingPeriodTo,
        },
        invoiceStatus,
        invoicePaymentMethod,
        lateFee: parseFloat(lateFee),
        planId,
        stripeId,
        customerId,
        accountId: customer.accountId,
        chargingType,
        printSetting,
        planName,
        recurringCharges: recurringCharges,
        netPrice: netAmount.toFixed(2),
        dueAmount: (totalAmount - amountPaid).toFixed(2),
        transId: customer?.invoiceTransId,
        paymentChannel,
        autopayChargeDate: updatedAutopayChargeDate,
      });

      // Save the new invoice to the database
      savedInvoice = await newInvoice.save();
    }

    // Update customer details
    const currentPlan = {
      planId: planId,
      planCharges: plan.price,
      additionalCharges: additionalCharges,
      invoiceDueDate: invoiceDueDate,
      discount: discount,
      planName: planName,
      billingPeriod: {
        from: billingPeriod.from,
        to: billingPeriod.to,
      },
      chargingType: chargingType,
      printSetting: printSetting,
      dueAmount: (totalAmount - amountPaid).toFixed(2),
    };
    let paymentMethodId;
    if (stripeTokenId) {
      //Create PaymentMethod using the token
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          token: stripeTokenId,
        },
      });
      console.log(paymentMethod.id);
      paymentMethodId = paymentMethod.id;
    }
    let dataToSave = {
      $push: { invoice: savedInvoice?._id },
      plan: planId,
      currentPlan: currentPlan,
      totalAmount: netAmount,
      selectProduct: Product?.inventoryType,
      dueAmount: (totalAmount - amountPaid).toFixed(2),
      billId: selectProduct,
      activeBillingConfiguration: {
        oneTimeCharge: invoiceOneTimeCharges,
        monthlyCharge: Product.monthlyCharge,
        dueDate: Product.dueDate,
        paymentMethod: Product.paymentMethod,
        BillCreationDate: Product.BillCreationDate,
        ServiceProvider: Product.ServiceProvider,
        selectdiscount: discount.map((discount) => ({
          name: discount.name, // Storing the discounted name in 'name' property
          amount: discount.amount,
        })),
        additionalFeature: additionalCharges.map((charge) => ({
          name: charge.name, // Storing the discounted name in 'name' property
          amount: charge.amount,
        })),
        applyLateFee: Product.applyLateFee,
        latefeeCharge: lateFee,
        subsequentBillCreateDate: Product.subsequentBillCreateDate,
        applyToCustomer: "newCustomer",
      },
      autopayChargeDate: autopayChargeDate,
      paymentMethodId,
      stripeCustomerId,
      isWithInvoice,
      isWithoutInvoice,
      wallet,
    };
    if (isAutopay === true) {
      dataToSave.autopayId = autopayId;
      dataToSave.isAutopay = isAutopay;
    }

    const customerUpdation = await CustModel.findOneAndUpdate(
      { _id: customerId },
      dataToSave,
      { new: true }
    );
    let updatedInvoice;
    if (paymentId) {
      updatedInvoice = await invoicemodel.findOneAndUpdate(
        { _id: savedInvoice._id },
        { $push: { paymentIds: paymentId } },
        { new: true }
      );
    }
    console.log(customerUpdation);
    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: updatedInvoice ? updatedInvoice : savedInvoice,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

invoice.post("/generateInvoice", async (req, res) => {
  try {
    // Extract required data from the request
    let {
      customerId,
      planId,
      stripeId,
      accountId,
      invoiceType,
      planCharges,
      additionalCharges,
      discount,
      totalAmount,
      amountPaid,
      invoiceDueDate,
      billingPeriod,
      invoiceStatus,
      invoicePaymentMethod,
      invoiceOneTimeCharges,
      lateFee,
      chargingType,
      printSetting,
      planName,
    } = req.body;

    // Retrieve customer details using the provided accountId
    let customer = await CustModel.findOne({ _id: customerId });
    console.log(customer.currentPlan.invoiceDueDate);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found with the provided accountId.",
      });
    }
    console.log(customer);
    let totalAdditionalCharges = 0;
    customer?.currentPlan?.additionalCharges?.forEach((charge) => {
      totalAdditionalCharges += parseFloat(charge.amount);
    });

    let totaldiscountCharges = 0;
    customer?.currentPlan?.discount?.forEach((charge) => {
      totaldiscountCharges += parseFloat(charge.amount);
    });
    console.log(totaldiscountCharges);
    const plann = await planModel.findById({ _id: planId });
    let netAmount = totalAdditionalCharges + plann.price;
    let recurringCharges = netAmount - totaldiscountCharges;
    netAmount = recurringCharges + parseFloat(customer.invoiceOneTimeCharges);
    netAmount -= parseFloat(amountPaid);

    // Generate invoice number with year, month, and accountId
    const currentDate = DateTime.now().setZone("America/New_York");
    const currentYear = currentDate.toFormat("yyyy");
    const currentMonth = currentDate.toFormat("LL");
    const invoiceNo = `${currentYear}-${currentMonth}-${customer.accountId}`;
    let dueDate = currentDate.plus({
      days: customer.currentPlan.invoiceDueDate,
    });

    // Convert dueDate to JavaScript Date object
    dueDate = dueDate.toJSDate();
    const billingPeriodFrom = currentDate.toFormat("MM-dd-yyyy");
    const billingPeriodTo = currentDate
      .plus({ days: 30 })
      .toFormat("MM-dd-yyyy");
    // Format the dueDate as MM-DD-YYYY
    const formattedDueDate = `${(dueDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${dueDate
      .getDate()
      .toString()
      .padStart(2, "0")}-${dueDate.getFullYear()}`;
    // Create a new invoice document
    const newInvoice = new invoicemodel({
      invoiceNo,
      invoiceType,
      planCharges: plann.price,
      discount: customer?.currentPlan?.discount,
      additionalCharges: customer?.currentPlan?.additionalCharges,
      totalAmount,
      amountPaid,
      invoiceDueDate: formattedDueDate,
      billingPeriod: {
        from: billingPeriodFrom,
        to: billingPeriodTo,
      },
      invoiceStatus,
      invoicePaymentMethod,
      invoiceOneTimeCharges: customer.invoiceOneTimeCharges,
      lateFee: customer?.lateFee,
      planId,
      stripeId,
      customerId,
      accountId: customer.accountId,
      chargingType,
      printSetting,
      planName,
      recurringCharges,
      netPrice: netAmount.toFixed(2),
      dueAmount: (totalAmount - amountPaid).toFixed(2),
      transId: customer?.invoiceTransId,
    });

    // Save the new invoice to the database
    const savedInvoice = await newInvoice.save();
    if (savedInvoice) {
      const currentPlan = {
        planId: customer.currentPlan.planId,
        planCharges: customer.currentPlan.planCharges,
        additionalCharges: customer.currentPlan.additionalCharges,
        invoiceDueDate: customer.currentPlan.invoiceDueDate,
        discount: customer.currentPlan.discount,
        planName: customer.currentPlan.planName,
        billingPeriod: {
          from: billingPeriod.from,
          to: billingPeriod.to,
        },
        discount: customer?.currentPlan?.discount,
        additionalCharges: customer?.currentPlan?.additionalCharges,
        chargingType: customer.currentPlan.chargingType,
        printSetting: customer.currentPlan.printSetting,
        dueAmount: (totalAmount - amountPaid).toFixed(2),
      };
      const customerUpdation = await CustModel.findOneAndUpdate(
        { _id: customerId },
        {
          $push: { invoice: savedInvoice?._id },
          plan: planId,
          currentPlan: currentPlan,
          totalAmount: netAmount,
          dueAmount: (totalAmount - amountPaid).toFixed(2),
        },
        { new: true } // Optional: This ensures the updated document is returned
      );
    }
    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: savedInvoice,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});
invoice.post("/adHocInvoiceGeneration", async (req, res) => {
  try {
    // Extract required data from the request
    let {
      enrollmentId,
      accountId,
      totalAmount,
      invoicetype,
      includeTaxes,
      invoiceDueDate,
      invoiceOneTimeCharges,
      amountPaid,
      invoicePaymentMethod,
    } = req.body;
    let wallet, dueAmount;
    // Retrieve customer details using the provided accountId
    let customer = await CustModel.findOne({ enrollmentId: enrollmentId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found with the provided accountId.",
      });
    }
    const currentDate = DateTime.now().setZone("America/New_York");
    const currentYear = currentDate.toFormat("yyyy");
    const currentMonth = currentDate.toFormat("LL");
    const invoiceNo = `${currentYear}-${currentMonth}-${customer.accountId}`;

    invoiceDueDate = convertDateToMMDDYYY(invoiceDueDate);
    if (amountPaid > totalAmount) {
      console.log("here");
      wallet = parseFloat(amountPaid) - parseFloat(totalAmount);
      dueAmount = 0;
      // wallet = customer.wallet
      //   ? parseFloat(customer.wallet) + parseFloat(wallet)
      //   : wallet;
      // await CustModel.findOneAndUpdate(
      //   { enrollmentId: enrollmentId },
      //   { wallet: wallet }
      // );
    } else {
      dueAmount = parseFloat(totalAmount) - parseFloat(amountPaid);
    }
    console.log(`wallet:${wallet}, dueAmount:${dueAmount}`);
    const newInvoice = new invoicemodel({
      enrollmentId,
      accountId,
      totalAmount: invoiceOneTimeCharges,
      invoiceOneTimeCharges: totalAmount,
      invoiceType: invoicetype,
      invoiceNo,
      includeTaxes,
      invoiceDueDate,
      amountPaid,
      invoicePaymentMethod,
      isAdHocInvoice: true,
      netPrice: dueAmount,
    });

    // Save the new invoice to the database
    const savedInvoice = await newInvoice.save();
    if (savedInvoice) {
      customer = await CustModel.findOneAndUpdate(
        { _id: customer._id },
        {
          $push: { adHocInvoice: savedInvoice._id },
        },
        { new: true }
      );
    }
    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: savedInvoice,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

invoice.get("/getplanbycustomerid", async (req, res) => {
  try {
    const { customerid } = req.query;

    // Validate if customerid is provided
    if (!customerid) {
      return res
        .status(400)
        .json({ success: false, message: "Customer ID is required." });
    }

    // Find the customer by ID and populate only the currentPlan field
    const foundCustomer = await CustModel.findById(customerid)
      .populate({
        path: "currentPlan",
        select: "-_id", // Exclude _id field from the result
      })
      .select("currentPlan");

    // Check if the customer exists
    if (!foundCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    // Return the found customer
    res.status(200).json({ success: true, data: foundCustomer });
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

invoice.post("/create-second-invoices", async (req, res) => {
  try {
    // Retrieve all billing configurations
    const billConfigs = await billingModel.find();
    console.log(billConfigs);
    if (!billConfigs || billConfigs.length === 0) {
      console.log("No billing configurations found.");
      return;
    }

    // Iterate over each billing configuration
    for (let billConfig of billConfigs) {
      let invoiceArray = [];
      // Extract the billing configuration ID
      const configId = billConfig._id;
      // Extract relevant criteria from the current billing configuration
      let subsequentBillCreateDate = parseInt(
        billConfig.subsequentBillCreateDate
      );
      console.log("configId", billConfig);
      //return 0;
      const Customers = await CustModel.find({ billId: configId });
      console.log("customers", Customers);
      for (const customer of Customers) {
        console.log("in loop");
        const custInvoice = customer.invoice; // Assuming invoice array exists in the customer model

        // If the invoice array is empty, skip to the next customer
        if (!custInvoice || custInvoice.length === 0) {
          console.log("Invoice array is empty for customer:", customer._id);
          continue; // Move to the next iteration of the loop
        }
        // Fetch the last invoice from the customer's invoice array
        const lastInvoice = customer.invoice[customer.invoice.length - 1];

        // Log the last invoice for this customer
        console.log(
          "Last invoice for customer",
          customer._id,
          ":",
          lastInvoice
        );
        let subsequent = customer.subsequentBill;
        console.log(customer.subsequentBill);
        // Calculate the dynamic date based on the subsequent bill creation date
        const oneDayAgo = new Date(
          Date.now() - subsequent * 24 * 60 * 60 * 1000
        );
        const startOfDay = new Date(oneDayAgo);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(oneDayAgo);
        endOfDay.setUTCHours(23, 59, 59, 999);
        // Query customers based on the current billing configuration
        //const customers =yyy
        console.log(startOfDay, endOfDay);
        // Process the last invoice as needed

        // Example: Fetch the invoice details from the database
        const lastInvoiceDetails = await invoicemodel.findOne({
          _id: lastInvoice,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        });

        // Example: Log the details of the last invoice
        console.log("Details of the last invoice:", lastInvoiceDetails);
        // Push the last invoice details to the array
        if (lastInvoiceDetails) {
          invoiceArray.push(lastInvoiceDetails);
        }
      }
      //return 0;
      // Calculate the dynamic date based on the subsequent bill creation date
      // const oneDayAgo = new Date(
      //   Date.now() - subsequentBillCreateDate * 24 * 60 * 60 * 1000
      // );
      // const startOfDay = new Date(oneDayAgo);
      // startOfDay.setUTCHours(0, 0, 0, 0);

      // const endOfDay = new Date(oneDayAgo);
      // endOfDay.setUTCHours(23, 59, 59, 999);
      // // Query customers based on the current billing configuration
      // //const customers =yyy
      // console.log(startOfDay, endOfDay);
      // const customersWithOverdue = await invoicemodel.find({
      //   invoiceCreateDate: { $gte: startOfDay, $lte: endOfDay },
      // });
      // console.log("customersWithOverdue", customersWithOverdue);
      await Promise.all(
        invoiceArray.map(async (customer) => {
          let cust = await CustModel.findOne({
            _id: customer.customerId,
          }).populate("plan");
          console.log("cust", cust);
          const billingPeriodEnd = customer.billingPeriod.to;

          // Set the start and end dates of the new invoice
          const newInvoiceStartDate = billingPeriodEnd;
          const daysToAdd = cust.activeBillingConfiguration.dueDate;
          const newInvoiceEndDate = new Date(billingPeriodEnd);
          newInvoiceEndDate.setDate(newInvoiceEndDate.getDate() + daysToAdd);

          // Get date components
          const month = String(newInvoiceEndDate.getMonth() + 1).padStart(
            2,
            "0"
          );
          const day = String(newInvoiceEndDate.getDate()).padStart(2, "0");
          const year = newInvoiceEndDate.getFullYear();

          //invoice number generation
          const currentDate = DateTime.now().setZone("America/New_York");
          const currentYear = currentDate.toFormat("yy");
          const currentMonth = currentDate.toFormat("LL");
          const invoiceNo = `${currentYear}-${currentMonth}-${cust.accountId}`;

          // Concatenate date components
          const formattedEndDate = `${month}-${day}-${year}`;
          let dueDate = currentDate.plus({
            days: billConfig.invoiceDueDate,
          });
          console.log(dueDate);

          let totalAmount, dueAmount;
          let totalAdditionalCharges = 0;
          cust?.activeBillingConfiguration?.additionalFeature?.forEach(
            (charge) => {
              totalAdditionalCharges += parseFloat(charge.amount);
            }
          );

          let totaldiscountCharges = 0;
          cust?.activeBillingConfiguration?.selectdiscount?.forEach(
            (charge) => {
              totaldiscountCharges += parseFloat(charge.amount);
            }
          );
          console.log(totaldiscountCharges);
          const plann = await planModel.findById({ _id: cust.plan._id });
          let netAmount = totalAdditionalCharges + plann.price;
          let recurringCharges = netAmount - totaldiscountCharges;

          // Convert dueDate to JavaScript Date object
          dueDate = dueDate.toJSDate();
          const formattedDueDate = `${(dueDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${dueDate
            .getDate()
            .toString()
            .padStart(2, "0")}-${dueDate.getFullYear()}`;
          console.log("dueDate", dueDate);
          //return 0;
          if (customer.dueAmount > "0") {
            totalAmount =
              parseFloat(customer.dueAmount) + parseFloat(customer.totalAmount);
          } else {
            totalAmount = customer.totalAmount;
          }
          dueAmount = totalAmount;

          // Create the new invoice
          const newInvoice = {
            billingPeriod: {
              from: newInvoiceStartDate,
              to: formattedEndDate,
            },
            invoiceNo: invoiceNo,
            planId: cust.planId,
            customerId: customer.customerId,
            invoiceType: customer.invoiceType,
            planCharges: customer.planCharges,
            additionalCharges:
              cust?.activeBillingConfiguration?.additionalFeature,
            discount: cust?.activeBillingConfiguration?.selectdiscount,
            totalAmount: totalAmount,
            netPrice: netAmount.toFixed(2),
            amountPaid: "0.00",
            invoiceDueDate: formattedDueDate,
            invoiceStatus: "pending", // You can set the initial status as needed
            invoicePaymentMethod: customer.invoicePaymentMethod,
            invoiceOneTimeCharges: customer.invoiceOneTimeCharges,
            accountId: customer.accountId,
            chargingType: customer.chargingType,
            printSetting: customer.printSetting,
            planName: cust.plan.name,
            lateFee: customer.lateFee,
            invoiceCreateDate: new Date(), // Set the current date as the creation date
            recurringCharges: recurringCharges,
            lateFee: customer.lateFee,
            dueAmount: dueAmount,
          };

          const invo = new invoicemodel(newInvoice);
          const result = await invo.save();
          console.log(result);
          cust.subsequentBill = billConfig.subsequentBillCreateDate;
          await cust.save();
          //cust = await CustModel.findOne({ _id: result.customerId });
          console.log("invoice array", cust.invoice);
          if (!Array.isArray(cust?.invoice)) {
            cust?.invoice ? [] : null;
          }

          // Push the new invoice into the 'invoice' array
          await cust?.invoice.push(result._id);

          // Save the updated customer document
          await cust?.save();
        })
      );
    }

    console.log(
      "Customer processing completed for all billing configurations."
    );
  } catch (error) {
    console.error("Error finding customers for billing configurations:", error);
  }
});
invoice.put("/update-current-plan/", async (req, res) => {
  try {
    const customerId = req.query.customerId;
    const {
      planId,
      planCharges,
      additionalCharges,
      invoiceDueDate,
      discount,
      planName,
      billingPeriod,
      chargingType,
      printSetting,
    } = req.body.currentPlan;

    const updatedCustomer = await CustModel.findOneAndUpdate(
      { _id: customerId },
      {
        currentPlan: {
          planId,
          planCharges,
          additionalCharges: additionalCharges.map((charge) => ({ ...charge })),
          invoiceDueDate,
          discount: discount.map((discount) => ({ ...discount })),
          planName,
          billingPeriod: {
            from: billingPeriod.from,
            to: billingPeriod.to,
          },
          chargingType,
          printSetting,
        },
      },
      { new: true } // Set to true to return the modified document
    );

    if (updatedCustomer) {
      res.status(200).json({
        msg: "Current plan updated successfully",
        data: updatedCustomer.currentPlan,
      });
    } else {
      res.status(404).json({
        error: "Customer not found",
      });
    }
  } catch (error) {
    console.error("Error in updating current plan:", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});
invoice.put("/updateInvoice", async (req, res) => {
  try {
    const { invoiceId } = req.query;
    let {
      amountPaid,
      invoiceStatus,
      invoicePaymentMethod,
      customerId,
      paymentId,
    } = req.body;
    let wallet, dueAmount;
    let findinvoice = await invoicemodel.findById(invoiceId);
    let customer = await CustModel.findOne({ _id: customerId });
    if (!customer) {
      return res.status(400).send({ msg: "customer not found" });
    }
    console.log(
      "amountPaid : findinvoice.netPrice",
      amountPaid,
      findinvoice.netPrice
    );
    if (parseFloat(amountPaid) > parseFloat(findinvoice.netPrice)) {
      console.log("here");
      wallet = parseFloat(amountPaid) - parseFloat(findinvoice.netPrice);
      console.log("wallet", wallet);
      // Update wallet balance if customer already has a wallet balance
      wallet = customer.wallet
        ? parseFloat(customer.wallet) + parseFloat(wallet)
        : wallet;
      await CustModel.findOneAndUpdate({ _id: customerId }, { wallet: wallet });
      console.log("wallet", wallet);
      dueAmount = 0; // Set dueAmount to 0 since payment covers the entire invoice
    } else {
      dueAmount = parseFloat(findinvoice.netPrice) - parseFloat(amountPaid);
      console.log("else", dueAmount);
    }
    console.log(dueAmount, wallet);
    amountPaid = parseFloat(amountPaid) + parseFloat(findinvoice.amountPaid);
    const update = await invoicemodel.findOneAndUpdate(
      {
        _id: invoiceId,
      },
      {
        amountPaid,
        invoiceStatus,
        invoicePaymentMethod,
        netPrice: dueAmount,
        $push: { paymentIds: paymentId },
      },
      { new: true }
    );
    if (update) {
      res.status(200).send({
        msg: "INVOICE updated successfully",
        data: update,
      });
    } else {
      res.status(404).send({
        error: "INVOICE not found",
      });
    }
  } catch (error) {
    console.error("Error in updating current plan:", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

async function findCustomersForBillingConfigurations() {
  try {
    // Retrieve all billing configurations
    const billConfigs = await billingModel.find();
    console.log(billConfigs);
    if (!billConfigs || billConfigs.length === 0) {
      console.log("No billing configurations found.");
      return;
    }

    // Iterate over each billing configuration
    for (let billConfig of billConfigs) {
      let invoiceArray = [];
      // Extract the billing configuration ID
      const configId = billConfig._id;
      // Extract relevant criteria from the current billing configuration
      let subsequentBillCreateDate = parseInt(
        billConfig.subsequentBillCreateDate
      );
      console.log("configId", billConfig);
      //return 0;
      const Customers = await CustModel.find({ billId: configId });
      console.log("customers", Customers);
      for (const customer of Customers) {
        console.log("in loop");
        const custInvoice = customer.invoice; // Assuming invoice array exists in the customer model

        // If the invoice array is empty, skip to the next customer
        if (!custInvoice || custInvoice.length === 0) {
          console.log("Invoice array is empty for customer:", customer._id);
          continue; // Move to the next iteration of the loop
        }
        // Fetch the last invoice from the customer's invoice array
        const lastInvoice = customer.invoice[customer.invoice.length - 1];

        // Log the last invoice for this customer
        console.log(
          "Last invoice for customer",
          customer._id,
          ":",
          lastInvoice
        );
        let subsequent = customer.subsequentBill;
        console.log(customer.subsequentBill);
        // Calculate the dynamic date based on the subsequent bill creation date
        const oneDayAgo = new Date(
          Date.now() - subsequent * 24 * 60 * 60 * 1000
        );
        const startOfDay = new Date(oneDayAgo);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(oneDayAgo);
        endOfDay.setUTCHours(23, 59, 59, 999);
        // Query customers based on the current billing configuration
        //const customers =yyy
        console.log(startOfDay, endOfDay);
        // Process the last invoice as needed

        // Example: Fetch the invoice details from the database
        const lastInvoiceDetails = await invoicemodel.findOne({
          _id: lastInvoice,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        });

        // Example: Log the details of the last invoice
        console.log("Details of the last invoice:", lastInvoiceDetails);
        // Push the last invoice details to the array
        if (lastInvoiceDetails) {
          invoiceArray.push(lastInvoiceDetails);
        }
      }

      await Promise.all(
        invoiceArray.map(async (customer) => {
          let cust = await CustModel.findOne({
            _id: customer.customerId,
          }).populate("plan");
          console.log("cust", cust);
          const billingPeriodEnd = customer.billingPeriod.to;

          // Set the start and end dates of the new invoice
          const newInvoiceStartDate = billingPeriodEnd;
          const daysToAdd = cust.activeBillingConfiguration.dueDate;
          const newInvoiceEndDate = new Date(billingPeriodEnd);
          newInvoiceEndDate.setDate(newInvoiceEndDate.getDate() + daysToAdd);

          // Get date components
          const month = String(newInvoiceEndDate.getMonth() + 1).padStart(
            2,
            "0"
          );
          const day = String(newInvoiceEndDate.getDate()).padStart(2, "0");
          const year = newInvoiceEndDate.getFullYear();

          //invoice number generation
          const currentDate = DateTime.now().setZone("America/New_York");
          const currentYear = currentDate.toFormat("yy");
          const currentMonth = currentDate.toFormat("LL");
          const invoiceNo = `${currentYear}-${currentMonth}-${cust.accountId}`;

          // Concatenate date components
          const formattedEndDate = `${month}-${day}-${year}`;
          let dueDate = cust?.activeBillingConfiguration?.dueDate
            ? cust?.activeBillingConfiguration?.updatedDueDate
            : currentDate.plus({
                days: cust?.activeBillingConfiguration?.dueDate,
              });
          console.log(dueDate);

          let totalAmount, dueAmount;
          let totalAdditionalCharges = 0;
          cust?.activeBillingConfiguration?.additionalFeature?.forEach(
            (charge) => {
              totalAdditionalCharges += parseFloat(charge.amount);
            }
          );

          let totaldiscountCharges = 0;
          cust?.activeBillingConfiguration?.selectdiscount?.forEach(
            (charge) => {
              totaldiscountCharges += parseFloat(charge.amount);
            }
          );
          console.log(totaldiscountCharges);
          const plann = await planModel.findById({ _id: cust.plan._id });
          let netAmount = totalAdditionalCharges + plann.price;
          let recurringCharges = netAmount - totaldiscountCharges;

          // Convert dueDate to JavaScript Date object
          dueDate = dueDate.toJSDate();
          const formattedDueDate = `${(dueDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${dueDate
            .getDate()
            .toString()
            .padStart(2, "0")}-${dueDate.getFullYear()}`;
          console.log("dueDate", dueDate);
          //return 0;
          if (customer.dueAmount > "0") {
            totalAmount =
              parseFloat(customer.dueAmount) + parseFloat(customer.totalAmount);
          } else {
            totalAmount = customer.totalAmount;
          }
          dueAmount = totalAmount;

          // Create the new invoice
          const newInvoice = {
            billingPeriod: {
              from: newInvoiceStartDate,
              to: formattedEndDate,
            },
            invoiceNo: invoiceNo,
            planId: cust.planId,
            customerId: customer.customerId,
            invoiceType: customer.invoiceType,
            planCharges: customer.planCharges,
            additionalCharges:
              cust?.activeBillingConfiguration?.additionalFeature,
            discount: cust?.activeBillingConfiguration?.selectdiscount,
            totalAmount: totalAmount,
            netPrice: netAmount.toFixed(2),
            amountPaid: "0.00",
            invoiceDueDate: formattedDueDate,
            invoiceStatus: "pending", // You can set the initial status as needed
            invoicePaymentMethod: customer.invoicePaymentMethod,
            invoiceOneTimeCharges: customer.invoiceOneTimeCharges,
            accountId: customer.accountId,
            chargingType: customer.chargingType,
            printSetting: customer.printSetting,
            planName: cust.plan.name,
            lateFee: customer.lateFee,
            invoiceCreateDate: new Date(), // Set the current date as the creation date
            recurringCharges: recurringCharges,
            lateFee: customer.lateFee,
            dueAmount: dueAmount,
          };

          const invo = new invoicemodel(newInvoice);
          const result = await invo.save();
          console.log(result);
          cust.subsequentBill = billConfig.subsequentBillCreateDate;
          await cust.save();
          //cust = await CustModel.findOne({ _id: result.customerId });
          console.log("invoice array", cust.invoice);
          if (!Array.isArray(cust?.invoice)) {
            cust?.invoice ? [] : null;
          }

          // Push the new invoice into the 'invoice' array
          await cust?.invoice.push(result._id);

          // Save the updated customer document
          await cust?.save();
        })
      );
    }

    console.log(
      "Customer processing completed for all billing configurations."
    );
  } catch (error) {
    console.error("Error finding customers for billing configurations:", error);
  }
}

async function autopayChargeCustomer() {
  try {
    // Get the current date
    //const currentDate = new Date();
    const currentDay = String(new Date().getDate());
    console.log(currentDay);

    // Find users whose autopayChargeDate matches the current date
    const users = await CustModel.find({
      autopayChargeDate: currentDay,
      isAutopay: true,
    });
    console.log(users);
    // Process payment for each user
    for (const customer of users) {
      const custInvoice = customer.invoice; // Assuming invoice array exists in the customer model
      console.log(custInvoice);
      // If the invoice array is empty, skip to the next customer
      if (!custInvoice || custInvoice.length === 0) {
        console.log("Invoice array is empty for customer:", customer._id);
        continue; // Move to the next iteration of the loop
      }
      // Fetch the last invoice from the customer's invoice array
      const lastInvoice = customer.invoice[customer.invoice.length - 1];

      // Log the last invoice for this customer
      console.log("Last invoice for customer", customer._id, ":", lastInvoice);

      // Example: Fetch the invoice details from the database
      const lastInvoiceDetails = await invoicemodel.findOne({
        _id: lastInvoice,
      });

      // Example: Log the details of the last invoice
      console.log("Details of the last invoice:", lastInvoiceDetails);
      let todayDate = new Date();
      todayDate = convertSIDateToMMDDYYY(todayDate);
      console.log(todayDate, " and ", lastInvoiceDetails.autopayChargeDate);
      if (lastInvoiceDetails.autopayChargeDate === todayDate) {
        // Example: If the last invoice is due today, process the payment
        console.log(
          "Last invoice is due today, processing payment for customer:",
          customer._id
        );
        let paymentMethodId = customer.paymentMethodId;
        let stripeCustomerId = customer.stripeCustomerId;

        const netPrice = parseFloat(lastInvoiceDetails.netPrice); // Parse netPrice as a float
        const amount = Math.round(netPrice * 100);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount, // Amount to charge in cents
          currency: "usd",
          payment_method: paymentMethodId,
          payment_method_types: ["card"],
          confirmation_method: "automatic", // Use automatic confirmation method
          setup_future_usage: "off_session", // Allow off-session payments
          confirm: true,
          description: "Autopay for subscription",
          customer: stripeCustomerId,
        });

        console.log("Payment Intent:", paymentIntent);
      }
    }
  } catch (error) {
    console.error("Error processing payments:", error);
  }
}

// Call the function to find customers for billing configurations

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      //await createSecondInvoices();
      await findCustomersForBillingConfigurations();
      await autopayChargeCustomer();
    } catch (error) {
      console.error("Error in automatic task:", error);
    }
  },
  {
    timezone: "UTC", // Set the timezone as needed
  }
);

invoice.post("/chargeCreditCard", async (req, res) => {
  const {
    amount,
    cardNumber,
    expirationDate,
    cardCode,
    accountId,
    invoiceId,
    customerId,
    serviceProvider,
    modules,
    paymentGateway,
  } = req.body;
  const result = await ClientGatewayCredential.findOne({
    clientId: serviceProvider,
    paymentGateway,
    modules,
    "gatewayCredentials.isActive": true,
  });

  // Check if result exists and if it has gatewayCredentials
  if (
    !result ||
    !result.gatewayCredentials ||
    result.gatewayCredentials.length === 0
  ) {
    return res.status(404).json({ error: "No active credentials found" });
  }

  // Extracting the first element from the array
  const activeCredential = result.gatewayCredentials.find(
    (credential) => credential.isActive === true
  );
  // console.log(activeCredential);
  // return 0;
  if (!activeCredential) {
    return res.status(404).json({ error: "No active credentials found" });
  }
  const valid = await InvalidDate(expirationDate);
  if (!valid) {
    return res.status(400).send({ msg: "Invalid Date" });
  }
  const date = new Date();
  const currMonth = (date.getMonth() + 1).toString().padStart(2, "0");
  const currYear = date.getFullYear();
  const currDate = `${currYear}-${currMonth}`;
  console.log("currDate", currDate);
  console.log("month", currMonth);
  if (expirationDate < currDate) {
    return res.status(400).json({
      msg: "expiration date should not be in past",
    });
  }

  // Exipration date limit 10 Years
  const maxExpiryDate = new Date(date);
  maxExpiryDate.setFullYear(date.getFullYear() + 10);

  if (new Date(expirationDate) > maxExpiryDate) {
    return res.status(400).json({
      msg: "Expiration date limit exceeded (10 Years)",
    });
  }
  const apiUrl = activeCredential.gatewayUrl;
  try {
    const requestBody = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: activeCredential.apiKey,
          transactionKey: activeCredential.apiSecret,
        },
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount,
          payment: {
            creditCard: {
              cardNumber: cardNumber,
              expirationDate: expirationDate,
              cardCode: cardCode,
            },
          },
          order: {
            invoiceNumber: accountId,
          },
        },
      },
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    console.log("Authorize.Net API Response:", response.data);

    if (response.data.messages.resultCode === "Ok") {
      const transactionResponse = response.data.createTransactionResponse;

      // Store transId and networkTransId in your database
      if (invoiceId) {
        const result = await invoicemodel.findOneAndUpdate(
          { _id: invoiceId }, // Assuming you have an 'invoiceNumber' field in your Invoice schema
          {
            transId: response.data.transactionResponse.transId,
            networkTransId: response.data.transactionResponse.networkTransId,
          }
        );
        console.log("update", result);
      } else {
        const result = await CustModel.findOneAndUpdate(
          { _id: customerId }, // Assuming you have an 'invoiceNumber' field in your Invoice schema
          {
            invoiceTransId: response.data.transactionResponse.transId,
            networkTransId: response.data.transactionResponse.networkTransId,
          }
        );
        console.log("update", result);
      }
      return res.status(response.status).send({
        msg: response.data.messages,
        data: response.data.transactionResponse,
      });
    } else {
      console.error("Transaction Failed:", response.data.messages);
      return res.status(response.status).send({
        error: "failed",
        data: response.data.messages,
      });
    }
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send({
      error: "failed",
      data: error.response ? error.response.data : error.message,
    });
  }
});
invoice.post("/chargeWallet", async (req, res) => {
  let { customerId, amount } = req.body;
  const cust = await CustModel.findOne({ _id: customerId });
  let paymentMethodId = cust.paymentMethodId;
  let stripeCustomerId = cust.stripeCustomerId;
  if (!paymentMethodId || !stripeCustomerId) {
    return res
      .status(400)
      .send({ msg: "paymentMethodId or stripeCustomerId not found" });
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount, // Amount to charge in cents
    currency: "usd",
    payment_method: paymentMethodId,
    payment_method_types: ["card"],
    description: "Add funds to wallet",
    customer: stripeCustomerId,
  });
  let wallet = cust.wallet ? cust.wallet : "0";
  console.log(wallet);
  wallet = parseFloat(wallet) + parseFloat(amount);

  const fundAdd = await CustModel.findOneAndUpdate(
    { _id: customerId },
    { wallet: wallet },
    { new: true }
  );
  if (fundAdd) {
    return res
      .status(200)
      .send({ msg: "succesfully added in wallet", data: fundAdd });
  } else {
    return res.status(400).send({ msg: "something went wrong while addition" });
  }
});

invoice.post("/echeckpayment", async (req, res) => {
  const {
    routingNumber,
    accountNumber,
    nameOnAccount,
    accountType,
    amount,
    accountId,
    invoiceId,
    customerId,
    serviceProvider,
    modules,
    paymentGateway,
  } = req.body;
  const result = await ClientGatewayCredential.findOne({
    clientId: serviceProvider,
    paymentGateway,
    modules,
    "gatewayCredentials.isActive": true,
  });

  // Check if result exists and if it has gatewayCredentials
  if (
    !result ||
    !result.gatewayCredentials ||
    result.gatewayCredentials.length === 0
  ) {
    return res.status(404).json({ error: "No active credentials found" });
  }

  // Extracting the first element from the array
  const activeCredential = result.gatewayCredentials.find(
    (credential) => credential.isActive === true
  );
  // console.log(activeCredential);
  // return 0;
  if (!activeCredential) {
    return res.status(404).json({ error: "No active credentials found" });
  }
  const apiUrl = activeCredential.gatewayUrl;
  try {
    const requestBody = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: activeCredential.apiKey,
          transactionKey: activeCredential.apiSecret,
        },
        transactionRequest: {
          transactionType: "authCaptureTransaction", // Indicates an eCheck transaction
          amount: amount, // Specify the amount to charge
          payment: {
            bankAccount: {
              accountType: accountType, // or 'savings'
              routingNumber: routingNumber, // Replace with the actual routing number
              accountNumber: accountNumber, // Replace with the actual account number
              nameOnAccount: nameOnAccount, // Replace with the account holder's name
            },
          },
          order: {
            invoiceNumber: accountId,
          },
        },
      },
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    console.log("Authorize.Net API Response:", response.data);

    if (response.data.messages.resultCode === "Ok") {
      const transactionResponse = response.data.createTransactionResponse;

      // Store transId and networkTransId in your database
      if (invoiceId) {
        const result = await invoicemodel.findOneAndUpdate(
          { _id: invoiceId }, // Assuming you have an 'invoiceNumber' field in your Invoice schema
          {
            transId: response.data.transactionResponse.transId,
          }
        );
        console.log("update", result);
      } else {
        const result = await CustModel.findOneAndUpdate(
          { _id: customerId }, // Assuming you have an 'invoiceNumber' field in your Invoice schema
          {
            invoiceTransId: response.data.transactionResponse.transId,
          }
        );
        console.log("update", result);
      }

      return res.status(response.status).send({
        msg: response.data.messages,
        data: response.data.transactionResponse,
      });
    } else {
      console.error("Transaction Failed:", response.data.messages);
      return res.status(response.status).send({
        error: "failed",
        data: response.data.messages,
      });
    }
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send({
      error: "failed",
      data: error.response ? error.response.data : error.message,
    });
  }
});

invoice.post("/refundTransaction", async (req, res) => {
  const {
    transactionIdToRefund,
    cardNumber,
    expirationDate,
    amount,
    serviceProvider,
    modules,
    paymentGateway,
  } = req.body;
  const result = await ClientGatewayCredential.findOne({
    clientId: serviceProvider,
    paymentGateway,
    modules,
    "gatewayCredentials.isActive": true,
  });

  // Check if result exists and if it has gatewayCredentials
  if (
    !result ||
    !result.gatewayCredentials ||
    result.gatewayCredentials.length === 0
  ) {
    return res.status(404).json({ error: "No active credentials found" });
  }

  // Extracting the first element from the array
  const activeCredential = result.gatewayCredentials.find(
    (credential) => credential.isActive === true
  );
  // console.log(activeCredential);
  // return 0;
  if (!activeCredential) {
    return res.status(404).json({ error: "No active credentials found" });
  }
  const apiUrl = activeCredential.gatewayUrl;
  try {
    // Create the request payload for the refund
    const requestBody = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: activeCredential.apiKey,
          transactionKey: activeCredential.apiSecret,
        },
        transactionRequest: {
          transactionType: "refundTransaction", // Indicates a refund transaction
          amount: amount, // Specify the amount to refund
          payment: {
            creditCard: {
              cardNumber: cardNumber,
              expirationDate: expirationDate,
            },
          },
          refTransId: transactionIdToRefund, // Transaction ID to refund
        },
      },
    };

    // Make the API request
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    console.log("Authorize.Net API Response:", response.data);

    if (response.data.messages.resultCode === "Ok") {
      const transactionResponse = response.data.createTransactionResponse;

      // // Store transId and networkTransId in your database
      // const result = await invoicemodel.findOneAndUpdate(
      //   { _id: invoiceId }, // Assuming you have an 'invoiceNumber' field in your Invoice schema
      //   {
      //     transId: response.data.transactionResponse.transId,
      //   }
      // );
      // console.log("update", result);

      return res.status(response.status).send({
        msg: response.data.messages,
        data: response.data.transactionResponse,
      });
    } else {
      console.error("Transaction Failed:", response.data.messages);
      return res.status(response.status).send({
        error: "failed",
        data: response.data.messages,
      });
    }
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send({
      error: "failed",
      data: error.response ? error.response.data : error.message,
    });
  }
});

function convertDateToMMDDYYY(date) {
  if (date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const timestamp = date;
    const dateOnly = timestamp.toISOString().split("T")[0];
    const parts = dateOnly.split("-");
    return `${parts[1]}-${parts[2]}-${parts[0]}`;
  } else {
    return "";
  }
}

function InvalidDate(expirationDate) {
  // Regular expression to match YYYY-MM format
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

  if (!dateRegex.test(expirationDate)) {
    return false; // Format doesn't match YYYY-MM
  }

  // Extract year and month from expiration date
  const [year, month] = expirationDate.split("-");

  // Convert month to number (1-indexed)
  const monthNumber = parseInt(month, 10);

  // Check if month is within valid range (1 to 12) and year is a valid year
  return monthNumber >= 1 && monthNumber <= 12 && year >= 1000 && year <= 9999;
}

function convertSIDateToMMDDYYY(date) {
  if (date) {
    const timestamp = new Date(date);
    const dateOnly = timestamp.toISOString().split("T")[0];
    const parts = dateOnly.split("-");
    console.log(typeof parts[2], parts[2]);
    if (parts[2] === "01") {
      return `${parts[1]}-${parts[2]}-${parts[0]}`;
    } else {
      return `${parts[1]}-${parts[2] - 1}-${parts[0]}`;
    }
  } else {
    return "";
  }
}

module.exports = invoice;
