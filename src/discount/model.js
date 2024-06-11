const { array } = require("joi");
const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;
const DiscountSchema = new Schema(
  {
    discountname: {
      type: String,
    },
    amount: {
      type: String,
    },
    ServiceProvider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
    },
  },
  { timestamps: true }
);
DiscountSchema.set("toJSON", {
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
const Discount = mongoose.model("Discount", DiscountSchema);
module.exports = Discount;
