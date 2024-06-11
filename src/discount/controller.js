const expressAsyncHandler = require("express-async-handler");
const { DateTime } = require('luxon');
const Discount = require('./model'); 
const mongoose = require("mongoose");
const { discountSchema,updateDiscountSchema } = require('./validation');

exports.adddiscount = expressAsyncHandler(async (req, res) => {
    try {
      // Validate request body against Joi schema
      const validatedData = await discountSchema.validateAsync(req.body);
  
      // Extract data from the validated data
      const { discountname, amount, ServiceProvider } = validatedData;
  
      // Create a new Discount instance
      const newDiscount = new Discount({
        discountname,
        amount,  // Assuming amount should be stored as a number
        ServiceProvider,
      });
  
      // Save the new discount to the database
      const savedDiscount = await newDiscount.save();
  
      // Send a success response with the saved discount data
      res.status(200).json({ message: 'Discount added successfully', data: savedDiscount });
    } catch (error) {
      // Joi validation error or other errors
      res.status(400).json({ error: error.message });
    }
  });
  exports.getalldiscounts= expressAsyncHandler(async (req, res) => {
    try {
      // Retrieve all discounts from the database
      const allDiscounts = await Discount.find();
  
      // Send a success response with all discount data
      res.status(200).json({ data: allDiscounts });
    } catch (error) {
      // Handle errors
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  exports.getdiscountbyid = expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.query; // Use req.params.id to get the id from the route parameter
      
      // Retrieve a discount by ID from the database
      const discount = await Discount.findById(id);
  
      // Check if the discount was found
      if (!discount) {
        return res.status(404).json({ error: 'Discount not found' });
      }
  
      // Send a success response with the discount data
      res.status(200).json({ data: discount });
    } catch (error) {
      // Handle errors
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
// Assuming you have a route like '/api/web/discount/updatediscount'
exports.updatediscount = expressAsyncHandler(async (req, res) => {
    try {
      // Validate request body against Joi schema
      const validatedData = await updateDiscountSchema.validateAsync(req.body);
  
      // Extract data from the validated data
      const { id, discountname, amount, ServiceProvider } = validatedData;
  
      // Update the discount in the database
      const updatedDiscount = await Discount.findByIdAndUpdate(
        id,
        { discountname, amount, ServiceProvider },
        { new: true } // Return the updated document
      );
  
      // Check if the discount was found and updated
      if (!updatedDiscount) {
        return res.status(404).json({ error: 'Discount not found' });
      }
  
      // Send a success response with the updated discount data
      res.status(200).json({ message: 'Discount updated successfully', data: updatedDiscount });
    } catch (error) {
      // Handle Joi validation error or other errors
      res.status(400).json({ error: error.message });
    }
  });
  exports.deletediscount = expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.query; // Extract the discount ID from the route parameter
  
      // Delete the discount from the database
      const deletedDiscount = await Discount.findByIdAndDelete(id);
  
      // Check if the discount was found and deleted
      if (!deletedDiscount) {
        return res.status(404).json({ error: 'Discount not found' });
      }
  
      // Send a success response with the deleted discount data
      res.status(200).json({ message: 'Discount deleted successfully', data: deletedDiscount });
    } catch (error) {
      // Handle errors, e.g., database errors
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });