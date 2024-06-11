const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const Schema = mongoose.Schema;

const InvoiceSchema = new Schema(
  {
    invoiceNo: [
      {
        type: String,
      },
    ],
    planId: {
      type: String,
    },
    paymentChannel: {
      type: String,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    stripeId: {
      type: String,
    },
    invoiceType: {
      type: String,
    },
    planCharges: {
      type: String,
    },
    additionalCharges: [
      {
        name: String,
        amount: String,
      },
    ],
    discount: [
      {
        name: String,
        amount: String,
      },
    ],
    totalAmount: {
      type: String,
    },
    transId: {
      type: String,
    },
    networkTransId: {
      type: String,
    },
    dueAmount: {
      type: String,
    },
    amountPaid: {
      type: String,
    },
    invoiceCreateDate: {
      type: Date,
      default: Date.now,
    },
    invoiceDueDate: {
      type: String,
    },
    billingPeriod: {
      from: {
        type: String,
      },
      to: {
        type: String,
      },
    },
    invoiceStatus: {
      type: String,
    },
    invoicePaymentMethod: {
      type: String,
    },
    invoiceOneTimeCharges: {
      type: String,
    },
    accountId: {
      type: String,
    },
    chargingType: {
      type: String,
    },
    printSetting: {
      type: String,
    },
    planName: {
      type: String,
    },
    lateFee: {
      type: String,
    },
    netPrice: {
      type: String,
    },
    recurringCharges: {
      type: String,
    },
    isAdHocInvoice: {
      type: Boolean,
      default: false,
    },
    includeTaxes: {
      type: Boolean,
    },
    autopayChargeDate: {
      type: String,
    },
    paymentIds: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

InvoiceSchema.set("toJSON", {
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
    if (ret.invoiceCreateDate) {
      ret.invoiceCreateDate = DateTime.fromJSDate(ret.invoiceCreateDate)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }

    return ret;
  },
});

const InvoiceModel = mongoose.model("Invoice", InvoiceSchema);
module.exports = InvoiceModel;
