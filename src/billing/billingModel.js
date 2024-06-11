const { array } = require("joi");
const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;
const BillingSchema = new Schema(
  {
    dueDate: {
      type: String,
    },
    subsequentBillCreateDate: {
      type: String,
    },
    latefeeCharge: {
      type: String,
    },
    applyLateFee: {
      type: String,
    },
    billingmodel: {
      type: String,
    },
    inventoryType: {
      type: String,
    },
    oneTimeCharge: {
      type: String,
    },
    monthlyCharge: [{ type: Schema.Types.ObjectId, ref: "Plan" }],
    paymentMethod: [
      {
        type: String,
        enum: ["Cash", "Credit Card", "Money Order", "E-Check", "Skip Payment"],
      },
    ],
    selectdiscount: [{ type: Schema.Types.ObjectId, ref: "Discount" }],
    additionalFeature: [
      {
        type: Schema.Types.ObjectId,
        ref: "Features",
      },
    ],

    ServiceProvider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
    },
    BillCreationDate: {
      type: String,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    applyToCustomer: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    billingconfigHistory: [
      {
        dueDate: { type: String },
        subsequentBillCreateDate: { type: String },
        latefeeCharge: { type: String },
        applyLateFee: { type: String },
        billingmodel: { type: String },
        inventoryType: { type: String },
        oneTimeCharge: { type: String },
        monthlyCharge: [{ type: Schema.Types.ObjectId, ref: "Plan" }],
        paymentMethod: [
          {
            type: String,
            enum: [
              "Cash",
              "Credit Card",
              "Money Order",
              "E-Check",
              "Skip Payment",
            ],
          },
        ],
        selectdiscount: [{ type: Schema.Types.ObjectId, ref: "Discount" }],
        additionalFeature: [{ type: Schema.Types.ObjectId, ref: "Features" }],
        serviceProvider: {
          type: Schema.Types.ObjectId,
          ref: "ServiceProvider",
        },
        billCreationDate: { type: String },
        applyToCustomer: { type: String },
        createDate: { type: String }, // Assuming this field exists in the schema
      },
    ],
  },
  { timestamps: true }
);
BillingSchema.set("toJSON", {
  transform: function (doc, ret) {
    if (ret.createdAt) {
      ret.createdAt = DateTime.fromJSDate(ret.createdAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }

    if (ret.updatedAt) {
      ret.updatedAt = DateTime.fromJSDate(ret.updatedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }

    return ret;
  },
});
const billingModel = mongoose.model("Billing", BillingSchema);
module.exports = billingModel;
