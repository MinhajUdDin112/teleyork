const Log = require("../logs/model");

async function loggerMiddleware(req, res, next) {
  const { method, path, body, params, query } = req;

  const log = new Log({
    method,
    path,
    request: {
      body,
      params,
      query,
    },
  });

  const oldSend = res.send;
  res.send = function (data) {
    log.response = data;

    log
      .save()
      .then(() => {
        console.log("Log saved successfully");
      })
      .catch((err) => {
        console.error("Failed to save log:", err);
      });

    res.send = oldSend;
    res.send(data);
  };

  next();
}

module.exports = loggerMiddleware;
