const mongoose = require("mongoose");

const ClientGatewayCredentialSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceProvider",
  },
  paymentGateway: {
    type: "String",
    enum: ["Stripe", "Authorize", "PayPal"],
  },
  gatewayCredentials: [
    {
      gatewayType: {
        type: String,
        enum: ["Test", "Production"],
      },
      apiKey: {
        type: String,
      },
      apiSecret: {
        type: String,
      },
      gatewayUrl: { type: String },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
  ],

  modules: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
  },
});
const ClientGatewayCredential = mongoose.model(
  "ClientGatewayCredential",
  ClientGatewayCredentialSchema
);

module.exports = ClientGatewayCredential;
