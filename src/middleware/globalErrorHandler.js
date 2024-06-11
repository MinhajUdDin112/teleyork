const uc = require("upper-case-first");
module.exports = async (err, req, res, next) => {
  //ERROR HANDLER
  console.log(err);
  if (err && err.code === 11000) {
    let errorKey = Object.keys(err["keyPattern"]).toString();
    errorKey = uc.upperCaseFirst(errorKey);
    return res.status(400).send({ msg: errorKey + " already exists" });
  }
  if (err.name === "ValidationError") {
   return res.status(400).send({
      msg: Object.values(err.errors).map((val) => val.message),
    });
  } else {
   return res.status(400).send({ msg: err.message });
  }
};
