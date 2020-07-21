/**
 * project JSDoc description
 * @module {Object} module name
 * @version 1.0.0
 * @author author name
 * @requires dependency 1
 * @requires dependency 2
 * ...
 */

"use strict";

//================================================================================
// dependencies
//================================================================================
// const restify = require("restify");
const dataHandlers = require("./lib/handlers");
// const utils = require("./lib/util");
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
// const server = restify.createServer({});

// server.post("/order/new", [
//     utils.validateHeaderContentJson,
//     utils.validateHeaderAcceptJson,
//     dataHandlers.bodyParser,
//     utils.validateBodyJson,
//     dataHandlers.enqueueOrder,
//     dataHandlers.sendData,
// ]);

// server.listen(1300, console.log("listening to the port 1300..."));
dataHandlers.handleOrders();
// dataHandlers.finishOrder();
