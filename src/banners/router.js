"use strict";
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const stripe1 = require("stripe")(process.env.STRIPE_SECRET_KEY);
const stripe2 = require("stripe")(process.env.STRIPE_PUBLISHABLE_KEY);
const mongoose = require("mongoose");
const axios = require("axios");
const bannerRouter = express.Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const model = require("./model");

// Configure multer for handling file uploads
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

// API endpoint for uploading multiple images
bannerRouter.post("/upload", upload.array("images", 10), async (req, res) => {
  const files = req.files;
  const paths = files.map((file) => ({ path: file.path }));

  try {
    // Store paths in MongoDB
    const savedImages = await model.insertMany(paths);
    res.json({ paths: savedImages.map((image) => image.path) });
  } catch (err) {
    console.error("Error inserting into database:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
bannerRouter.put("/update", upload.single("newImage"), async (req, res) => {
  const { id } = req.query;
  const newImagePath = req.file ? req.file.path : null; // Get the file path from req.file or set it to null if no file was uploaded

  try {
    // Find the image by ID
    const existingImage = await model.findById(id);
    if (!existingImage) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Update the image path with the new image path
    existingImage.path = newImagePath;
    const updatedImage = await existingImage.save();

    res.json({ message: "Image updated successfully", image: updatedImage });
  } catch (err) {
    console.error("Error updating image:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Change Active Status API
bannerRouter.put("/change-status", async (req, res) => {
  const { id } = req.query;
  const { isActive } = req.body;

  try {
    const updatedImage = await model.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    if (!updatedImage) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.json({
      message: "Image active status changed successfully",
      image: updatedImage,
    });
  } catch (err) {
    console.error("Error changing active status:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Get all images API
bannerRouter.get("/all", async (req, res) => {
  try {
    const allImages = await model.find();
    res.json({ images: allImages });
  } catch (err) {
    console.error("Error fetching all images:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Get image by ID API using req.query
bannerRouter.get("/getImageById", async (req, res) => {
  const { id } = req.query;
  try {
    if (!id) {
      return res.status(400).json({ error: "Image ID is required" });
    }

    const image = await model.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json({ image });
  } catch (err) {
    console.error("Error fetching image by ID:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

bannerRouter.post("/create_account", async (req, res) => {
  try {
    // Create the customer data
    const customerData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      description: "User Account Created",
    };
    // Make the API request to create a new customer
    const customer = await stripe1.customers.create(customerData);

    // Make entry in DB & generate token
    res.status(200).send({ msg: "account created", data: customer });
  } catch (err) {
    res.status(501).send({ error: err.message });
  }
});
// API endpoint for checking out orders
bannerRouter.post("/create_payment", async (req, res) => {
  try {
    const paymentData = {
      amount: 1000, // Amount in cents (e.g., $10.00)
      currency: "usd", // Currency (e.g., USD)
      customer: req.body.customerId, // ID of the customer making the payment
      description: "Payment for service", // Description of the payment
      // Add additional fields as needed
    };

    // Make the API request to create a new payment
    const paymentIntent = await stripe1.paymentIntents.create(paymentData);

    // Return client secret to confirm payment on the client-side
    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(501).send({ error: err.message });
  }
});

bannerRouter.post("/paymentMethod", async (req, res) => {
  try {
    console.log("here");
    const stri =
      "pk_test_51OcirDLVLQnJs4K0bDuAGI0kOqwpv7EPz8QAHP1ck2233eZ1EtPjZHT1CWgPamZKCAlEZdhPSAQwtjBKQXgpm9zF00t20QE6EZ";
    // Tokenize card details using Stripe.js
    console.log(stri);
    const token = await stripe2.tokens.create({
      card: {
        number: "4242424242424242",
        exp_month: "7",
        exp_year: "2027",
        cvc: "123",
      },
    });
    console.log(token.id);
    // // Create PaymentMethod using the token
    // const paymentMethod = await stripe1.paymentMethods.create({
    //   type: "card",
    //   card: {
    //     token: token.id,
    //   },
    // });
    // // console.log(paymentMethod.id);

    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: 30000, // Amount to charge in cents
    //   currency: "usd",
    //   payment_method: "pm_1P8l6TLVLQnJs4K0XllmAeeL",
    //   payment_method_types: ["card"],
    //   confirmation_method: "automatic", // Use automatic confirmation method
    //   setup_future_usage: "off_session", // Allow off-session payments
    //   confirm: true,
    //   description: "Autopay for subscription",
    //   customer: "cus_PyhrWkLGCLGPaM",
    // });
    res.status(200).send({ clientSecret: token });
  } catch (err) {
    res.status(501).send({ error: err.message });
  }
});

bannerRouter.post("/tokenGeneration", async (req, res) => {
  try {
    const { cardNumber, expmoonth, expYear, cvc } = req.body;

    const token = await stripe2.tokens.create({
      card: {
        number: "4242424242424242",
        exp_month: "5",
        exp_year: "2027",
        cvc: "314",
      },
    });

    res.status(200).send({ clientSecret: token });
  } catch (err) {
    res.status(501).send({ error: err.message });
  }
});

module.exports = bannerRouter;
