const { PhoneNumberUtil } = require("google-libphonenumber");
const phoneUtil = PhoneNumberUtil.getInstance();

module.exports = function validateMobileNumber(mobileNumber) {
  try {
    // Parse the phone number
    const phoneNumber = phoneUtil.parseAndKeepRawInput(mobileNumber);

    // Check if the phone number is valid
    return phoneUtil.isValidNumber(phoneNumber);
  } catch (error) {
    // Invalid phone number
    return false;
  }
};
