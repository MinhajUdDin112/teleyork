const model = require("./invoicemodel");
const userservice = require("../user/service");
const planservice = require("../plan/service");
const billingModel = require("../billing/billingModel");
const planModel = require("../plan/model");
const service = {
  bulkinvoice: async (
    customerId,
    planId,
    accountId,
    planName,
    planCharges,
    activationDate
  ) => {
    const currentDate = new Date();
    const invoiceDueDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    let billingPeriodFrom = new Date(activationDate); // Start from the activation date
    const billingPeriodTo = new Date(
      billingPeriodFrom.getFullYear(),
      billingPeriodFrom.getMonth(),
      billingPeriodFrom.getDate() + 30
    ); // Set the end date to 30 days from the start date

    let invoices = [];
    let invoicesIds = [];

    while (billingPeriodFrom < currentDate) {
      const isLastBill = billingPeriodTo >= currentDate;

      const invoiceNo = `${billingPeriodFrom.getFullYear()}-${(
        billingPeriodFrom.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${accountId}`;
      const formattedDueDate = `${(billingPeriodFrom.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${billingPeriodFrom
        .getDate()
        .toString()
        .padStart(2, "0")}-${billingPeriodFrom.getFullYear()}`;
      const body = {
        customerId,
        planId,
        invoiceNo: [invoiceNo],
        accountId,
        invoiceType: "Monthly Bill",
        planCharges,
        additionalCharges: [],
        discount: [],
        netPrice: isLastBill ? planCharges : "0.00",
        totalAmount: planCharges,
        dueAmount: isLastBill ? planCharges : "0.00",
        amountPaid: isLastBill ? "0.00" : planCharges,
        recurringCharges: planCharges,
        invoiceDueDate: formattedDueDate,
        invoiceCreateDate: billingPeriodFrom.toISOString().slice(0, 10),
        createdAt: billingPeriodFrom,
        billingPeriod: {
          from: billingPeriodFrom.toISOString().slice(0, 10),
          to: billingPeriodTo.toISOString().slice(0, 10),
        },
        invoiceStatus: isLastBill ? "Unpaid" : "Paid", // Set status based on whether it's the last bill
        invoicePaymentMethod: "Credit Card",
        invoiceOneTimeCharges: "0",
        lateFee: "5",
        chargingType: "Monthly",
        printSetting: "Both",
        planName,
        selectProduct: "SIM",
      };

      const saveinvoice = new model(body);
      const result = await saveinvoice.save();
      invoices.push(result);
      invoicesIds.push(result._id);

      // Move to the next billing period
      billingPeriodFrom.setDate(billingPeriodFrom.getDate() + 30);
      billingPeriodTo.setDate(billingPeriodTo.getDate() + 30);
    }
    console.log("invoices", invoices);
    console.log(invoicesIds);
    return invoicesIds;
  },
  bulkInvoiceSave: async (
    customerId,
    planId,
    accountId,
    planName,
    planCharges,
    activationDate
  ) => {
    const currentDate = new Date();
    const invoiceDueDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    let billingPeriodFrom = new Date(activationDate); // Start from the activation date
    const billingPeriodTo = new Date(
      billingPeriodFrom.getFullYear(),
      billingPeriodFrom.getMonth(),
      billingPeriodFrom.getDate() + 30
    ); // Set the end date to 30 days from the start date

    let invoices = [];
    let invoicesIds = [];

    while (billingPeriodFrom < currentDate) {
      const invoiceNo = `${billingPeriodFrom.getFullYear()}-${(
        billingPeriodFrom.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${accountId}`;
      const formattedDueDate = `${(billingPeriodFrom.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${billingPeriodFrom
        .getDate()
        .toString()
        .padStart(2, "0")}-${billingPeriodFrom.getFullYear()}`;
      const body = {
        customerId,
        planId,
        invoiceNo: [invoiceNo],
        accountId,
        invoiceType: "Monthly Bill",
        planCharges,
        additionalCharges: [],
        discount: [
          {
            name: "ACP Discount Applied",
            amount: "30",
          },
        ],
        netPrice: "0.00",
        totalAmount: "0.00",
        dueAmount: "0.00",
        amountPaid: "0.00",
        recurringCharges: "0.00",
        invoiceDueDate: formattedDueDate, //invoiceDueDate.toISOString().slice(0, 10), // Convert to YYYY-MM-DD format
        invoiceCreateDate: billingPeriodFrom.toISOString().slice(0, 10), //currentDate.toISOString().slice(0, 10), // Convert to YYYY-MM-DD format
        createdAt: billingPeriodFrom, //currentDate.toISOString().slice(0, 10), // Convert to YYYY-MM-DD format
        billingPeriod: {
          from: billingPeriodFrom.toISOString().slice(0, 10), // Convert to YYYY-MM-DD format
          to: billingPeriodTo.toISOString().slice(0, 10), // Convert to YYYY-MM-DD format
        },
        invoiceStatus: "Paid",
        invoicePaymentMethod: "Credit Card",
        invoiceOneTimeCharges: "0",
        lateFee: "0",
        chargingType: "Monthly",
        printSetting: "Both",
        planName,
        selectProduct: "SIM",
      };

      const saveinvoice = new model(body);
      const result = await saveinvoice.save();
      invoices.push(result);
      invoicesIds.push(result._id);

      // Move to the next billing period
      billingPeriodFrom.setDate(billingPeriodFrom.getDate() + 30);
      billingPeriodTo.setDate(billingPeriodTo.getDate() + 30);
    }
    console.log("invoices", invoices);
    console.log(invoicesIds);
    return invoicesIds;
  },
  updateInvoice: async (
    invoiceId,
    amountPaid,
    invoiceStatus,
    invoicePaymentMethod,
    customerId
  ) => {
    let wallet, dueAmount;

    // Find the invoice
    let invoice = await invoicemodel.findById(invoiceId);
    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }

    // Find the customer
    let customer = await CustModel.findOne({ _id: customerId });
    if (!customer) {
      return { success: false, message: "Customer not found" };
    }

    // Calculate due amount and wallet
    if (parseFloat(amountPaid) > parseFloat(invoice.netPrice)) {
      wallet = parseFloat(amountPaid) - parseFloat(invoice.netPrice);
      dueAmount = 0;
      customer.wallet = customer.wallet
        ? parseFloat(customer.wallet) + parseFloat(wallet)
        : wallet;
      await customer.save();
    } else {
      dueAmount = invoice.netPrice - amountPaid;
    }

    // Update the invoice
    invoice.amountPaid =
      parseFloat(amountPaid) + parseFloat(invoice.amountPaid);
    invoice.invoiceStatus = invoiceStatus;
    invoice.invoicePaymentMethod = invoicePaymentMethod;
    invoice.netPrice = dueAmount;
    await invoice.save();

    return { success: true, message: "Invoice updated successfully" };
  },
  BillConfig: async (Inventory_Type, accountType, userId, invoice) => {
    let amountPaid = "0";
    console.log(userId);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let user = await userservice.getByUserID(userId);
    if (!user) {
      return res.status(400).send({ msg: "customer not found" });
    }

    let currPlan = await planservice.getOne(user.plan);
    const billingConfig = await billingModel
      .findOne({
        billingmodel: accountType,
        inventoryType: Inventory_Type,
      })
      .populate({
        path: "selectdiscount",
        select: "discountname amount",
      })
      .populate({
        path: "additionalFeature",
        select: "featureName featureAmount",
      });

    //console.log(billingConfig);
    if (!billingConfig) {
      return res.status(400).send({
        msg: "BillingConfig for Prepaid, SIM not found. Please add billingConfig First",
      });
    }
    const lastInvoiceId = invoice[invoice.length - 1]; // Pick the last invoice _id
    const lastInvoice = await model.findById(lastInvoiceId); // Search for the last invoice

    const currentPlan = {
      planId: currPlan._id,
      planCharges: currPlan.price,
      additionalCharges: [],
      invoiceDueDate: billingConfig.dueDate,
      discount: [],
      planName: currPlan.name,
      billingPeriod: {
        from: lastInvoice.billingPeriod.from,
        to: lastInvoice.billingPeriod.to,
      },
      chargingType: "Monthly",
      printSetting: "Both",
    };
    return { currentPlan, billingConfig };
  },
};
module.exports = service;
