const expressAsyncHandler = require("express-async-handler");
const { DateTime } = require('luxon');
const Feature = require('./model'); 
const mongoose = require("mongoose");
const { updateFeaturesSchema,FeaturesSchema } = require('./validation');

exports.addfeature = expressAsyncHandler(async (req, res) => {
    try {
      // Validate request body against Joi schema
      const validatedData = await FeaturesSchema.validateAsync(req.body);
  
      // Extract data from the validated data
      const { featureName, featureAmount, ServiceProvider } = validatedData;
  
      // Create a new Discount instance
      const newDiscount = new Feature({
        featureName,
        featureAmount,  // Assuming amount should be stored as a number
        ServiceProvider,
      });
  
      // Save the new discount to the database
      const savedDiscount = await newDiscount.save();
  
      // Send a success response with the saved discount data
      res.status(200).json({ message: 'ADDITIONAL FEATURE added successfully', data: savedDiscount });
    } catch (error) {
      // Joi validation error or other errors
      res.status(400).json({ error: error.message });
    }
  });
  exports.getallfeatures= expressAsyncHandler(async (req, res) => {
    try {
      // Retrieve all discounts from the database
      const allDiscounts = await Feature.find();
  
      // Send a success response with all discount data
      res.status(200).json({ data: allDiscounts });
    } catch (error) {
      // Handle errors
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  exports.getfeaturesbyid = expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.query; // Use req.params.id to get the id from the route parameter
      
      // Retrieve a discount by ID from the database
      const discount = await Feature.findById(id);
  
      // Check if the discount was found
      if (!discount) {
        return res.status(404).json({ error: 'Feature not found' });
      }
  
      // Send a success response with the discount data
      res.status(200).json({ data: discount });
    } catch (error) {
      // Handle errors
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
// Assuming you have a route like '/api/web/discount/updatediscount'
exports.updatefeature = expressAsyncHandler(async (req, res) => {
    try {
      // Validate request body against Joi schema
      const validatedData = await updateFeaturesSchema.validateAsync(req.body);
  
      // Extract data from the validated data
      const { id,featureName, featureAmount, ServiceProvider } = validatedData;
  
      // Update the discount in the database
      const updatedDiscount = await Feature.findByIdAndUpdate(
        id,
        { featureName, featureAmount, ServiceProvider },
        { new: true } // Return the updated document
      );
  
      // Check if the discount was found and updated
      if (!updatedDiscount) {
        return res.status(404).json({ error: 'Feature not found' });
      }
  
      // Send a success response with the updated discount data
      res.status(200).json({ message: 'Feature updated successfully', data: updatedDiscount });
    } catch (error) {
      // Handle Joi validation error or other errors
      res.status(400).json({ error: error.message });
    }
  });
  exports.deletefeature = expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.query; // Extract the discount ID from the route parameter
  
      // Delete the discount from the database
      const deletedDiscount = await Feature.findByIdAndDelete(id);
  
      // Check if the discount was found and deleted
      if (!deletedDiscount) {
        return res.status(404).json({ error: 'Feature not found' });
      }
  
      // Send a success response with the deleted discount data
      res.status(200).json({ message: 'Feature deleted successfully', data: deletedDiscount });
    } catch (error) {
      // Handle errors, e.g., database errors
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });