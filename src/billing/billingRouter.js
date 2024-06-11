const express = require("express");
const mongoose = require("mongoose");
const billingRouter = express.Router();
const billingServices = require("./billingServices");
const AppError = require("../helpers/apiError");
const ClientGatewayCredential = require("../paymentMethod/model");
const expressAsyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const multer = require("multer");
const cron = require("node-cron");
const CustModel = require("../user/model");
const invoicemodel = require("../invoices/invoicemodel");

const {
  validateBillConfig,
  validateGetBillById,
  validateUpdateBill,
  validateUpdateBillConfig,
} = require("./validation");
const model = require("./billingModel");

const Payment = require("./paymentmodel");
const Customer = require("../user/model");
const Discount = require("../discount/model");
const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;
const stripe = require("stripe")(STRIPE_SECRET_KEY);
const stripe2 = require("stripe")(STRIPE_PUBLISHABLE_KEY);
const { mode } = require("crypto-js");
// Get all billings
billingRouter.get("/", async (req, res) => {
  try {
    const result = await billingServices.getAll();
    res.status(200).send({ msg: "Bills", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});
billingRouter.get(
  "/getProductByBillModel",
  expressAsyncHandler(async (req, res) => {
    const { billingModel, serviceProvider } = req.query;

    const result = await billingServices.getProductByBillModel(
      billingModel,
      serviceProvider
    );
    const inventoryTypes = result.map((entry) => ({
      inventoryType: entry.inventoryType,
    }));

    if (inventoryTypes.length > 0) {
      return res
        .status(200)
        .send({ msg: "inventoryTypes", data: inventoryTypes });
    } else {
      return res.status(400).send({ msg: "billingModel details not found" });
    }
  })
);
billingRouter.get(
  "/getPlansByProductId",
  expressAsyncHandler(async (req, res) => {
    const { productId, serviceProvider, billingmodel } = req.query;

    const result = await billingServices.getPlansByProductId(
      productId,
      serviceProvider,
      billingmodel
    );
    const plans = result.map((entry) => ({
      monthlyCharge: entry.monthlyCharge,
      additionalFeature: entry.additionalFeature,
      selectdiscount: entry.selectdiscount,
      paymentMethod: entry.paymentMethod,
    }));

    if (result) {
      return res
        .status(200)
        .send({ msg: "Plans", data: plans, object: result });
    } else {
      return res.status(400).send({ msg: "Plans not found" });
    }
  })
);

// Get a billing by ID
billingRouter.get("/getById", async (req, res) => {
  const { billId } = req.query;
  try {
    const result = await billingServices.getById(billId);
    if (result) {
      res.status(200).send({ msg: "Bill", data: result });
    } else {
      res.status(404).json({ msg: "Billing not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

billingRouter.get("/getall", async (req, res) => {
  try {
    const result = await billingServices.getAllBill();
    res.status(200).send({ msg: "AllBills", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: `Internal server error: ${error}` });
  }
});
billingRouter.post(
  "/billconfig",
  expressAsyncHandler(async (req, res, next) => {
    try {
      const {
        billingmodel,
        inventoryType,
        oneTimeCharge,
        monthlyCharge,
        dueDate,
        paymentMethod,
        selectdiscount,
        BillCreationDate,
        ServiceProvider,
        additionalFeature,
        applyLateFee,
        latefeeCharge,
        subsequentBillCreateDate,
      } = req.body;

      const validate = validateBillConfig.validate(req.body);
      console.error("Validation error details:", validate.error);
      if (validate.error) {
        return next(new AppError(validate.error, 400));
      }

      // Check if a record with the same billingmodel and inventoryType already exists
      const existingRecord = await model.findOne({
        billingmodel,
        inventoryType,
      });

      if (existingRecord) {
        return res.status(400).send({
          msg: "Duplicate entry",
          error:
            "A record with the same billingmodel and inventoryType already exists.",
        });
      }

      // If no duplicate, proceed with saving the new record
      const result = await billingServices.billconfig(
        billingmodel,
        inventoryType,
        oneTimeCharge,
        monthlyCharge,
        dueDate,
        paymentMethod,
        selectdiscount,
        BillCreationDate,
        ServiceProvider,
        additionalFeature,
        applyLateFee,
        latefeeCharge,
        subsequentBillCreateDate
      );

      res.status(200).send({ msg: "Bill Configed", data: result });
    } catch (error) {
      console.log(error);
      res
        .status(400)
        .send({ msg: `something went wrong`, error: error.message });
    }
  })
);
billingRouter.put(
  "/billconfig",
  expressAsyncHandler(async (req, res, next) => {
    try {
      const { id } = req.query;
      let {
        oneTimeCharge,
        monthlyCharge,
        dueDate,
        paymentMethod,
        selectdiscount,
        BillCreationDate,
        ServiceProvider,
        additionalFeature,
        applyLateFee,
        latefeeCharge,
        subsequentBillCreateDate,
        applyToCustomer,
      } = req.body;
      console.log(req.body);
      const validate = validateUpdateBillConfig.validate(req.body);
      console.error("Validation error details:", validate.error);
      if (validate.error) {
        return next(new AppError(validate.error, 400));
      }

      // Check if the record exists
      const existingRecord = await billingServices.getById(id);
      if (!existingRecord) {
        return res.status(404).send({
          msg: "Record not found",
          error: "No record found with the provided ID.",
        });
      }
      // Prevent updating billingmodel or inventoryType
      if (
        req.body.billingmodel &&
        req.body.billingmodel !== existingRecord.billingmodel
      ) {
        return res.status(400).send({
          msg: "Invalid update",
          error: "Updating billingmodel is not allowed.",
        });
      }

      if (
        req.body.inventoryType &&
        req.body.inventoryType !== existingRecord.inventoryType
      ) {
        return res.status(400).send({
          msg: "Invalid update",
          error: "Updating inventoryType is not allowed.",
        });
      }

      let curBillConfig;
      //return 0;
      if (applyToCustomer === "existing") {
        curBillConfig = await billingServices.getOne(id, "newCustomer");
        console.log(curBillConfig);
        let customer = await Customer.updateMany(
          { billId: id },
          {
            activeBillingConfiguration: {
              oneTimeCharge,
              monthlyCharge,
              dueDate,
              paymentMethod,
              BillCreationDate,
              ServiceProvider,
              selectdiscount: existingRecord?.selectdiscount.map(
                (discount) => ({
                  name: discount.discountname, // Storing the discounted name in 'name' property
                  amount: discount.amount,
                })
              ),
              additionalFeature: existingRecord?.additionalFeature.map(
                (charge) => ({
                  name: charge.featureName, // Storing the discounted name in 'name' property
                  amount: charge.featureAmount,
                })
              ),
              applyLateFee,
              latefeeCharge,
              subsequentBillCreateDate,
              applyToCustomer,
            },
            $push: {
              billingConfigurationHistory: {
                oneTimeCharge,
                monthlyCharge,
                dueDate,
                paymentMethod,
                selectdiscount,
                BillCreationDate,
                ServiceProvider,
                additionalFeature,
                applyLateFee,
                latefeeCharge,
                subsequentBillCreateDate,
                applyToCustomer,
              },
            },
          }
        );
        console.log(customer);
      } else if (applyToCustomer === "newCustomer") {
        curBillConfig = await billingServices.getOne(id, "existing");
        console.log(curBillConfig);
      } else {
        curBillConfig = await billingServices.getOne(id, "both");
        console.log(curBillConfig);
        let customer = await Customer.updateMany(
          { billId: id },
          {
            activeBillingConfiguration: {
              oneTimeCharge,
              monthlyCharge,
              dueDate,
              paymentMethod,
              selectdiscount,
              BillCreationDate,
              ServiceProvider,
              additionalFeature,
              applyLateFee,
              latefeeCharge,
              subsequentBillCreateDate,
              applyToCustomer,
            },
            $push: {
              billingConfigurationHistory: {
                oneTimeCharge,
                monthlyCharge,
                dueDate,
                paymentMethod,
                selectdiscount,
                BillCreationDate,
                ServiceProvider,
                additionalFeature,
                applyLateFee,
                latefeeCharge,
                subsequentBillCreateDate,
                applyToCustomer,
              },
            },
          }
        );
        console.log(customer);
      }

      // Update only the allowed fields
      const result = await model.findOneAndUpdate(
        { _id: id },
        {
          oneTimeCharge,
          monthlyCharge,
          dueDate,
          paymentMethod,
          selectdiscount,
          BillCreationDate,
          ServiceProvider,
          additionalFeature,
          applyLateFee,
          latefeeCharge,
          subsequentBillCreateDate,
          applyToCustomer,
          $push: {
            billingconfigHistory: curBillConfig,
          },
        },
        { new: true } // Return the updated document
      );

      res.status(200).send({ msg: "Bill Config updated", data: result });
    } catch (error) {
      console.log(error);
      res.status(400).send({ msg: "Update error", error: error.message });
    }
  })
);
billingRouter.delete(
  "/deletebillconfig",
  expressAsyncHandler(async (req, res, next) => {
    try {
      const { billId } = req.query;

      // Use deleteOne directly on the model with the provided _id
      const result = await model.deleteOne({ _id: billId });

      if (result.deletedCount === 0) {
        return res.status(404).send({
          msg: "Record not found",
          error: "No record found with the provided ID.",
        });
      }

      res.status(200).send({ msg: "Bill Deleted", data: result });
    } catch (error) {
      console.log(error);
      res.status(500).send({ msg: "Internal server error" });
    }
  })
);

billingRouter.get(
  "/getBillById",
  expressAsyncHandler(async (req, res, next) => {
    try {
      const { billId } = req.query; // Use req.query for GET requests
      const validate = validateGetBillById.validate({ billId });

      if (validate.error) {
        return next(
          new AppError(
            `Validation error: ${validate.error.details
              .map((err) => err.message)
              .join(", ")}`,
            400
          )
        );
      }

      const result = await billingServices.getBillById(billId);

      if (result) {
        res.status(200).send({ msg: "Bill", data: result });
      } else {
        res.status(404).send({ msg: "Billing not found" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ msg: "Internal server error", error: error.message });
    }
  })
);

billingRouter.put(
  "/updatebill",
  expressAsyncHandler(async (req, res, next) => {
    try {
      const {
        billid,
        billingmodel,
        inventoryType,
        oneTimeCharge,
        monthlyCharge,
        dueDate,
        paymentMethod,
        selectdiscount,
        BillCreationDate,
        ServiceProvider,
        additionalFeature,
        applyLateFee,
        latefeeCharge,
        subsequentBillCreateDate,
      } = req.body;

      const validate = validateUpdateBill.validate(req.body); // Make sure this is correct
      if (validate.error) {
        return next(new AppError(validate.error, 400));
      }

      // Continue with the rest of your route logic

      const result = await billingServices.updateBill(
        billid,
        billingmodel,
        inventoryType,
        oneTimeCharge,
        monthlyCharge,
        dueDate,
        paymentMethod,
        selectdiscount,
        BillCreationDate,
        ServiceProvider,
        additionalFeature,
        applyLateFee,
        latefeeCharge,
        subsequentBillCreateDate
      );

      if (result) {
        res.status(200).send({ msg: "Bill updated", data: result });
      } else {
        res.status(404).send({ msg: "Billing not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).send({ msg: "Validation error", error: error.details });
    }
  })
);

billingRouter.get(
  "/getClientSecret",
  expressAsyncHandler(async (req, res) => {
    try {
      const clientSecret = intent.client_secret;

      // console.log('Client Secret:', clientSecret);

      res.status(200).json({ clientSecret });
    } catch (error) {
      console.error("Error creating Setup Intent:", error.message);
      res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
  })
);
billingRouter.post(
  "/paymentintent",
  expressAsyncHandler(async (req, res) => {
    try {
      const { amount } = req.body;
      // Create a PaymentIntent
      const intent = await stripe.paymentIntents.create({
        payment_method_types: ["card"],
        amount: amount * 100, // Amount in cents (e.g., $1.00)
        currency: "usd", // Currency code
      });

      res.status(200).json({ clientSecret: intent.client_secret });
    } catch (error) {
      console.error("Error creating PaymentIntent:", error.message);
      res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
  })
);

billingRouter.get(
  "/billingpayments",
  expressAsyncHandler(async (req, res) => {
    try {
      const { billingmodel, inventoryType } = req.query;

      if (!billingmodel || !inventoryType) {
        return res.status(400).send({
          success: false,
          message: "BillingModel and InventoryType are required parameters.",
        });
      }
      const inventoryTypesArray = inventoryType.split(",");
      // Find distinct billing models based on the provided billingmodel and inventoryType
      const billingModels = await model
        .find({
          billingmodel: billingmodel,
          inventoryType: { $in: inventoryTypesArray },
        })
        .distinct("paymentMethod")
        .exec();

      const paymentMethods = billingModels.map((method) => ({
        _id: method,
        paymentMethod: method,
      }));

      res.status(200).send({ success: true, data: paymentMethods });
    } catch (error) {
      console.error("Error fetching billing models:", error);
      res
        .status(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  })
);
billingRouter.get(
  "/plans",
  expressAsyncHandler(async (req, res) => {
    try {
      const { inventoryType, billingmodel } = req.query;

      if (!inventoryType || !billingmodel) {
        return res.status(400).send({
          success: false,
          message: "InventoryType and BillingModel are required parameters.",
        });
      }

      // Split the inventoryType string into an array
      const inventoryTypesArray = inventoryType.split(",");

      const plans = await model
        .find({
          billingmodel: billingmodel,
          inventoryType: { $in: inventoryTypesArray },
        })
        .populate("monthlyCharge")
        .populate({
          path: "selectdiscount",
          select: "_id discountname amount",
        })
        .populate({
          path: "additionalFeature",
          select: "_id featureName featureAmount",
        });

      res.status(200).send({ success: true, data: plans });
    } catch (error) {
      console.error("Error fetching plans:", error);
      res
        .status(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  })
);

billingRouter.get("/getBillConfig", async (req, res) => {
  try {
    const result = await billingServices.getBillConfig();
    res.status(200).send({ msg: "AllBills", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: `Internal server error: ${error}` });
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({ storage: storage });
billingRouter.post(
  "/uploadmultiple",
  upload.array("images", 10),
  async (req, res) => {
    const files = req.files;
    const paths = files.map((file) => ({ path: file.banner }));

    try {
      // Store paths in MongoDB
      const savedImages = await Customer.insertMany(paths);
      res.json({ paths: savedImages.map((image) => image.banner) });
    } catch (err) {
      console.error("Error inserting into database:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

billingRouter.put("/statusUpdate", async (req, res) => {
  const { active, billId } = req.body;
  if (!billId || active === undefined) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  try {
    const result = await billingServices.statusUpdate(billId, active);
    res.status(200).send({ msg: "Bill updated", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: `Internal server error: ${error}` });
  }
});
billingRouter.get("/getInactiveBillingConfig", async (req, res) => {
  const { serviceProvider } = req.query;
  try {
    const result = await billingServices.getInactive(serviceProvider);
    res
      .status(200)
      .send({ msg: "inactive billing configuration", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: `Internal server error: ${error}` });
  }
});
billingRouter.post("/process-refund", async (req, res) => {
  try {
    const { chargeId } = req.body;

    // Check if chargeId is provided
    if (!chargeId) {
      return res.status(400).json({ error: "Charge ID is required" });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
    });

    // Send success response
    return res
      .status(200)
      .json({ message: "Refund processed successfully", refund });
  } catch (error) {
    console.error("Error processing refund:", error);

    // Send error response
    return res.status(500).json({ error: "Failed to process refund" });
  }
});

billingRouter.post("/retrieve-payment-intent", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Check if paymentIntentId is provided
    if (!paymentIntentId) {
      return res
        .status(400)
        .json({ error: "Payment Intent ID is required in the request body" });
    }

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Send success response
    return res.status(200).json({
      message: "Payment Intent retrieved successfully",
      paymentIntent,
    });
  } catch (error) {
    console.error("Error retrieving Payment Intent:", error);

    // Send error response
    return res.status(500).json({ error: "Failed to retrieve Payment Intent" });
  }
});
billingRouter.post("/paymentMethod", async (req, res) => {
  try {
    const token = "tok_1P845eLVLQnJs4K0aXSy50oQ"; // Assuming token is sent in request body

    const charge = await stripe.charges.create({
      amount: 1000,
      currency: "usd",
      source: token,
      description: "Payment for service",
    });

    res.status(200).send({ clientSecret: charge });
  } catch (err) {
    res.status(501).send({ error: err.message });
  }
});
billingRouter.get("/stripetoken", async (req, res) => {
  try {
    const { tokenId } = req.query;
    if (!tokenId) {
      return res.status(400).json({ error: "Token ID is required" });
    }

    const token = await stripe.tokens.retrieve(tokenId);
    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error retrieving token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
billingRouter.put("/changeDueDate", async (req, res) => {
  const { updatedDueDate, customerId } = req.body;
  if (!updatedDueDate || !customerId) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  try {
    // Find the customer based on the customerId
    const customer = await CustModel.findById(customerId);
    if (!customer) {
      return res.status(404).send({ msg: "Customer not found" });
    }

    // Update the activeBillingConfiguration field by adding or updating the updatedDueDate
    customer.activeBillingConfiguration = {
      ...customer.activeBillingConfiguration,
      updatedDueDate: updatedDueDate,
    };

    // Save the updated customer
    const updatedCustomer = await customer.save();

    res.status(200).send({ msg: "Due Date Changed", data: updatedCustomer });
  } catch (error) {
    console.error("Error changing due date:", error);
    res.status(500).send({ msg: "Internal Server Error" });
  }
});

// Schedule the cron job to run daily at midnight
cron.schedule("0 0 * * *", async () => {
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
        let custCardDetails = customer.cards;
        let { cardNumber, cardCvc, cardExpiryMonth, cardExpiryYear } =
          custCardDetails;
        console.log(customer.cards.cardCvc);
        // Create a token using the card details
        const token = await stripe2.tokens.create({
          card: {
            number: cardNumber,
            exp_month: cardExpiryMonth,
            exp_year: cardExpiryYear,
            cvc: cardCvc,
          },
        });

        // Log the generated token
        console.log("Token created:", token);
        const netPrice = parseFloat(lastInvoiceDetails.netPrice); // Parse netPrice as a float
        const amount = Math.round(netPrice * 100);
        const paymentIntent = await stripe.charges.create({
          amount: amount,
          currency: "usd",
          //payment_method_types: ["card"],
          source: token.id, // Use the ID of the created token
          //confirm: true,
        });

        console.log("Payment Intent:", paymentIntent);
      }
    }
  } catch (error) {
    console.error("Error processing payments:", error);
  }
});

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

module.exports = billingRouter;
