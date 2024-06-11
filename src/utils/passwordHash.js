const bcryptjs = require("bcryptjs");

const hash = async (password) => {
  return await bcryptjs.hash(password, 12);
};

const validatePassword = async (password, hash) => {
  const isValid = await bcryptjs.compare(password, hash);
  return isValid;
};

module.exports = { hash, validatePassword };
