const errors = require("restify-errors");

exports.errorHandler = function errorHandler(next, logger) {
  return function (error) {
    console.log(error.message);
    if(error.code === "ECONNREFUSED") {
        return next(new errors.ServiceUnavailableError("Message broker unavailable"))
    }
    return next(new errors.InternalServerError("internal server error"));
  };
};
