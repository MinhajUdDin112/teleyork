const invoiceNo = require("../utils/invoiceNo");
const billingModel = require("./billingModel");
const Billing = require("./billingModel");
const planModel = require("../plan/model");

const billingServices = {
  getAll: async () => {
    const result = await Billing.find()
      .populate("userId")
      .populate("service_id");
    return result;
  },

  getById: async (id) => {
    const result = await Billing.findById(id)
      .populate({
        path: "selectdiscount",
        select: { discountname: 1, amount: 1 },
      })
      .populate({
        path: "additionalFeature",
        select: { featureName: 1, featureAmount: 1 },
      })
      .populate("monthlyCharge")
      .populate("paymentMethod");
    return result;
  },
  getProductByBillModel: async (billingmodel, ServiceProvider) => {
    const result = await Billing.find({
      billingmodel,
      ServiceProvider,
    }).populate({
      path: "inventoryType",
      select: { _id: 1, inventoryType: 1 },
    });
    return result;
  },
  getPlansByProductId: async (inventoryType, ServiceProvider, billingmodel) => {
    let query = {
      inventoryType,
      ServiceProvider,
      billingmodel,
    };
    let result = await Billing.find(query)
      .populate({
        path: "selectdiscount",
        select: "discountname amount",
      })
      .populate({
        path: "monthlyCharge",
        select: { _id: 1, name: 1, planId: 1, price: 1 },
      })
      .populate({
        path: "additionalFeature",
        select: "featureName featureAmount",
      })
      .populate("subsequentBillCreateDate")
      .populate("latefeeCharge")
      .populate("applyLateFee")
      .populate("inventoryType")
      .populate("billingmodel");
    console.log(result);
    // Check if applyToCustomer is not defined or is set to 'both' or 'newCustomer'
    // Check if applyToCustomer is not defined or is set to 'both' or 'newCustomer'
    if (result && result.length > 0) {
      result = result.map((doc) => {
        if (doc.applyToCustomer === "existing") {
          console.log("here is already");
          // If applyToCustomer is 'existing', find the last document in billConfigHistory where applyToCustomer is 'newCustomer' or 'both'
          if (doc.billingconfigHistory && doc.billingconfigHistory.length > 0) {
            const lastConfig = doc.billingconfigHistory
              .slice()
              .reverse()
              .find(
                (config) =>
                  config.applyToCustomer === "newCustomer" ||
                  config.applyToCustomer === "both"
              );
            if (lastConfig) {
              return lastConfig;
            }
          }
        } else {
          // Remove billConfigHistory from the document
          const { billingconfigHistory, ...rest } = doc.toObject();
          return rest;
        }
        return doc.toObject();
      });
    }

    return result;
  },
  billconfig: async (
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
  ) => {
    const bill = new Billing({
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
    });
    const result = await bill.save();
    return result;
  },

  create: async (
    userId,
    serviceProvider,
    invoiceNo,
    invoiceType,
    payment_method,
    cycleDate,
    planRental,
    tax,
    processingFee,
    additionalCharges,
    mergeInvoiceAmount,
    monthlyBill,
    previousDues,
    advanceAdjust,
    invoiceBalance,
    createdApplied,
    lateFee,
    IOTChildDue,
    total,
    amount_paid,
    totalDues,
    dueDate,
    dueGraceDate,
    lateFeeApplication,
    createdBy,
    createdDate,
    source,
    payment_date,
    paidUsing,
    is_paid
  ) => {
    const newBilling = new Billing({
      userId,
      serviceProvider,
      invoiceNo,
      invoiceType,
      payment_method,
      cycleDate,
      planRental,
      tax,
      processingFee,
      additionalCharges,
      mergeInvoiceAmount,
      monthlyBill,
      previousDues,
      advanceAdjust,
      invoiceBalance,
      createdApplied,
      lateFee,
      IOTChildDue,
      total,
      amount_paid,
      totalDues,
      dueDate,
      dueGraceDate,
      lateFeeApplication,
      createdBy,
      createdDate,
      source,
      payment_date,
      paidUsing,
      is_paid,
    });
    const result = await newBilling.save();
    return result;
  },
  createBill: async (serviceProvider, userId, type, plan) => {
    const userPlan = await planModel.findOne({ _id: plan });
    const now = new Date();
    let cycleDate = now.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    });
    cycleDate = new Date(cycleDate);
    cycleDate.setDate(cycleDate.getDate() + 1);
    console.log(cycleDate); // Output: "5/25/2023" (or a similar format)
    let otherDate = new Date(cycleDate);
    otherDate.setDate(otherDate.getDate() + 30);

    // Formatting cycleDate and otherDate in the desired format
    let formattedCycleDate = cycleDate.toISOString().split("T")[0];
    let formattedOtherDate = otherDate.toISOString().split("T")[0];

    // Creating the billing cycle string
    let billingCycle = formattedCycleDate + " To " + formattedOtherDate;

    console.log(billingCycle);
    const dueDate = new Date(cycleDate);
    dueDate.setDate(dueDate.getDate() + 15);
    console.log(dueDate);
    const dueGraceDate = new Date(dueDate);
    dueGraceDate.setDate(dueGraceDate.getDate() + 5);
    console.log(dueGraceDate);
    const invoice = await invoiceNo();
    console.log(invoice);
    const data = new billingModel({
      serviceProvider,
      userId,
      invoiceNo: invoice,
      invoiceType: type,
      billCycle: billingCycle,
      cycleDate,
      dueDate,
      dueGraceDate,
      createdDate: cycleDate,
      planRental: userPlan.price,
    });
    const result = await data.save();
    console.log("result", result);
    return result;
  },
  update: async (
    _id,
    payment_method,
    amount_due,
    amount_paid,
    payment_date
  ) => {
    const result = await billingModel.findOneAndUpdate(
      { _id },
      { payment_method, amount_due, amount_paid, payment_date },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await billingModel.deleteOne({ _id });
    return result;
  },
  getAllBill: async () => {
    const results = await Billing.find()
      .populate({
        path: "selectdiscount",
        select: "discountname amount",
      })
      .populate("monthlyCharge", "name")
      .populate({
        path: "additionalFeature",
        select: "featureName featureAmount",
      })
      .populate("subsequentBillCreateDate")
      .populate("latefeeCharge")
      .populate("applyLateFee")
      .populate("inventoryType")
      .populate("billingmodel")
      .populate({
        path: "billingconfigHistory",
        populate: [
          { path: "monthlyCharge", select: "name" },
          { path: "additionalFeature", select: "featureName featureAmount" },
          { path: "selectdiscount", select: "discountname amount" },
        ],
      });

    const allBills = [];

    results.forEach((result) => {
      // Remove unnecessary fields from each document
      const {
        billingconfigHistory,
        createdAt,
        updatedAt,
        __v,
        ...cleanedResult
      } = result.toObject();

      // Check if billingconfigHistory exists and has items
      if (billingconfigHistory && billingconfigHistory.length > 0) {
        let lastConfigWithApplyToCustomer = null;
        // Iterate through billingconfigHistory in reverse order
        for (let i = billingconfigHistory.length - 1; i >= 0; i--) {
          const config = billingconfigHistory[i];
          // Check if applyToCustomer is "newCustomer" or "both"
          if (
            config.applyToCustomer === "newCustomer" ||
            config.applyToCustomer === "both"
          ) {
            lastConfigWithApplyToCustomer = config;
            break; // Stop iteration after finding the last applicable config
          }
        }
        if (lastConfigWithApplyToCustomer !== null) {
          allBills.push(lastConfigWithApplyToCustomer);
        }
      } else {
        allBills.push(cleanedResult);
      }
    });

    return allBills;
  },
  getBillConfig: async () => {
    const results = await Billing.find()
      .populate({
        path: "selectdiscount",
        select: "discountname amount",
      })
      .populate("monthlyCharge", "name")
      .populate({
        path: "additionalFeature",
        select: "featureName featureAmount",
      })
      .populate("subsequentBillCreateDate")
      .populate("latefeeCharge")
      .populate("applyLateFee")
      .populate("inventoryType")
      .populate("billingmodel")
      .populate({
        path: "billingconfigHistory",
        populate: [
          { path: "monthlyCharge", select: "name" },
          { path: "additionalFeature", select: "featureName featureAmount" },
          { path: "selectdiscount", select: "discountname amount" },
        ],
      });
    return results;
  },
  getBillById: async (id) => {
    const result = await Billing.findById(id)
      .populate("selectdiscount", "discountname")
      .populate("monthlyCharge", "name")
      .populate("additionalFeature")
      .populate("subsequentBillCreateDate")
      .populate("latefeeCharge")
      .populate("applyLateFee")
      .populate("inventoryType")
      .populate("billingmodel");
    return result;
  },
  getOne: async (id, applyToCustomer) => {
    const result = await Billing.findById(id);
    // Remove billingconfigHistory, createdAt, updatedAt, and __v from the fetched document
    const {
      billingconfigHistory,
      createdAt,
      updatedAt,
      __v,
      ...cleanedResult
    } = result.toObject();

    // Add applyToCustomer to the cleanedResult object
    cleanedResult.applyToCustomer = applyToCustomer;

    // Add createDate with the current date to the cleanedResult object
    const createDate = new Date().toISOString();
    cleanedResult.createDate = createDate;

    return cleanedResult;
  },
  updateBill: async (
    _id,
    billingmodel,
    inventoryType,
    oneTimeCharge,
    monthlyCharge,
    dueDate,
    paymentMethod,
    selectdiscount,
    BillCreationDate,
    additionalFeature,
    applyLateFee,
    latefeeCharge,
    subsequentBillCreateDate
  ) => {
    const result = await billingModel.findOneAndUpdate(
      { _id },
      {
        billingmodel,
        inventoryType,
        oneTimeCharge,
        monthlyCharge,
        dueDate,
        paymentMethod,
        selectdiscount,
        BillCreationDate,
        additionalFeature,
        applyLateFee,
        latefeeCharge,
        subsequentBillCreateDate,
      },
      { new: true }
    );
    return result;
  },
  deleteBillConfig: async (id) => {
    try {
      // Find and delete the billing configuration by ID
      const deletedBillConfig = await Billing.findByIdAndDelete(id);

      return deletedBillConfig;
    } catch (error) {
      // Handle errors, e.g., database errors
      console.error(error);
      throw new Error("Failed to delete billing configuration");
    }
  },
  statusUpdate: async (_id, active) => {
    const result = await billingModel.findOneAndUpdate(
      { _id },
      { active },
      { new: true }
    );
    return result;
  },
  getInactive: async (serviceProvider) => {
    const result = await billingModel.find({ serviceProvider, active: false });
    return result;
  },
};

module.exports = billingServices;
