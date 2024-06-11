const model = require("./apiAuthModel");
const mongoose = require("./apiAuthModel");

const apiAuthServices = {
  addAuth: async (username, password) => {
    const newUser = new model({
      username: username,
      password: password,
    });
    const result = await newUser.save();
    return result;
  },
  authenticate: async (username, password) => {
    const result = await model.findOne({
      username: username,
    });
    return result;
  },
};

module.exports = apiAuthServices;
