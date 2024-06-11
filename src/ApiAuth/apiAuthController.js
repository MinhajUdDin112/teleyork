const expressAsyncHandler = require("express-async-handler");
const service = require("./apiAuthServices");
const ApiError = require("../helpers/apiError");
const model = require("./apiAuthModel");
const bcrypt = require("bcrypt");

exports.addCred = expressAsyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new ApiError(400, "Please provide username and password");
  }

  const existUser = await model.findOne({ username: username });
  if (existUser) {
    throw new ApiError(400, "Username already exists");
  }

  // Hash the password before storing it in the database
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await service.addAuth(username, hashedPassword);
  if (result) {
    res.status(201).json({
      message: "Credentials added successfully",
    });
  } else {
    res.status(400).json({
      message: "error occured",
    });
  }
});
