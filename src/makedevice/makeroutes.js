
const makeController = require('./controller');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const makeRoutes = require('./makeroutes');
const router = express.Router();

// Create a new make
router.post('/createMake', makeController.createMake);

// Get all makes
router.get('/makes', makeController.getAllMakes);

// Get a single make by ID
router.get('/make/:id', makeController.getMakeById);

// Update a make by ID
router.put('/make/:id', makeController.updateMakeById);

// Delete a make by ID
router.delete('/make/:id', makeController.deleteMakeById);

module.exports = router;