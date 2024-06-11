const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const ClientGatewayCredential = require("../paymentMethod/model");
const mongoose = require("mongoose");
const model = require("../serviceProvider/model");

exports.createClient = async (req, res) => {
  try {
    const { clientId, paymentGateway, gatewayCredentials, modules } = req.body;

    // Check if any module already has the provided payment gateway
    const existingClient = await ClientGatewayCredential.findOne({
      modules: modules,
      paymentGateway: paymentGateway,
    });

    if (existingClient) {
      return res.status(400).json({
        error: "Payment gateway already exists for the provided module",
      });
    }

    const client = new ClientGatewayCredential({
      clientId,
      paymentGateway,
      gatewayCredentials,
      modules,
    });
    await client.save();
    res.status(201).json({ msg: "success", client: client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const { id } = req.query; // Assuming your query parameter is named 'id'
    if (!id) {
      return res.status(400).json({ error: "ID parameter is missing" });
    }

    const client = await ClientGatewayCredential.findOne({
      _id: new mongoose.Types.ObjectId(id),
      // isActive: true,
    }).populate({
      path: "modules",
      select: "name -_id", // Only select the name field
    });
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getall = async (req, res) => {
  try {
    const result = await ClientGatewayCredential.find().populate({
      path: "modules",
      select: "name ", // Only select the name field
    });

    // Send the result in the response
    res.json({ msg: "All configure Payment Methods", result: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.query; // Assuming your query parameter is named 'id'
    if (!id) {
      return res.status(400).json({ error: "ID parameter is missing" });
    }

    const { clientId, paymentGateway, gatewayCredentials, modules } = req.body;

    const updatedClient = await ClientGatewayCredential.findOneAndUpdate(
      { _id: id }, // Constructing the filter object
      { gatewayCredentials, modules, paymentGateway, clientId },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.changeActiveStatus = async (req, res) => {
  try {
    const { id } = req.query; // Assuming your query parameter is named 'id'
    if (!id) {
      return res.status(400).json({ error: "ID parameter is missing" });
    }

    const { isActive, gatewayType } = req.body;
    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ error: "isActive parameter must be a boolean value" });
    }

    // Find the client
    const client = await ClientGatewayCredential.findById(id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Update isActive for all gatewayCredentials
    client.gatewayCredentials.forEach((credential) => {
      if (credential.gatewayType === gatewayType) {
        credential.isActive = isActive;
      } else {
        // Set other gateways' isActive to true if current gateway is set to false
        credential.isActive = !isActive;
      }
    });

    // Save the updated client
    const updatedClient = await client.save();

    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const Id = req.query.Id;
    const deletedClient = await ClientGatewayCredential.findOneAndDelete({
      _id: Id,
    });
    if (!deletedClient) {
      return res.status(404).json({ error: "ID not found" });
    }
    res.json({ message: "deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getCompanyUrl = async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await model.findOne(serviceProvider);
  if (!result) {
    return res.status(404).json({ error: "Company not found" });
  }

  res.status(200).send({ msg: "Company URL", result: result });
};
exports.getcredentials = async (req, res) => {
  const { serviceProvider, modules, paymentGateway } = req.query;

  try {
    const result = await ClientGatewayCredential.findOne({
      clientId: serviceProvider,
      paymentGateway,
      modules,
      "gatewayCredentials.isActive": true,
    });

    if (!result) {
      return res.status(404).json({ error: "GatewayCredentials not found" });
    }

    // Filter out inactive gatewayCredentials
    const activeCredentials = result.gatewayCredentials.filter(
      (credential) => credential.isActive === true
    );
    console.log(activeCredentials);
    if (activeCredentials.length === 0) {
      return res.status(404).json({ error: "No active credentials found" });
    }

    return res.status(200).json({
      msg: `${paymentGateway} credentials`,
      result: {
        gatewayCredentials: activeCredentials,
        modules: modules,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
exports.getInactivePaymentMethods = async (req, res) => {
  try {
    const result = await ClientGatewayCredential.find({
      "gatewayCredentials.isActive": false,
    });
    if (result.length === 0) {
      return res
        .status(404)
        .json({ error: "No inactive payment methods found" });
    }
    return res
      .status(200)
      .json({ message: "All inactive Payment Methods", result: result });
  } catch (error) {
    console.error("Error fetching inactive payment methods:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
