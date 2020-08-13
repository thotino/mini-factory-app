/**
 * project JSDoc description
 * @module {Object} module name
 * @version 1.0.0
 * @author Thotino GOBIN-GANSOU
 * @requires bluebird
 * @requires ./lib/handlers
 */

"use strict";

//================================================================================
// dependencies
//================================================================================
const Promise = require("bluebird");
const restify = require("restify");
const dataHandlers = require("./lib/handlers");
//================================================================================
// config
//================================================================================
/** import here configurations */

//================================================================================
// aliases
//================================================================================
/** declare here local variables aliasing some of often used imports / conf options */

//================================================================================
// module
//================================================================================
const server = restify.createServer({});

server.get("/status", (req, res) => {
  res.json({"status": "OK"});
});

const port = process.env.PORT || 1400;
server.listen(port, () => {
  Promise.try(() => {
    return dataHandlers.handleOrders().then((data) => {
      console.log(data);
    });
  });
});


