"use strict";

const Promise = require("bluebird");
const request = Promise.promisifyAll(require("request").defaults({jar: true}), {
  filter: (funcName) => { return /put|patch|post|head|del(ete)?|get/.test(funcName); },
  multiArgs: true,
});
const mongoose = require("mongoose");

const utilRabbitmq = require("rabbitmq-utils");

const currentQueue = "orders-queue";
const productionQueue = "production-queue";

const handleOrders = exports.handleOrders = function handleOrders() {
  return Promise.try(() => {
    return utilRabbitmq.consumeAndReplyWith(currentQueue, updateOrderWithSerialNumbers)
      .then((curMessage) => {
        console.log("CUR MESSAGE : ", curMessage);
        return curMessage;
      });
  });
};

const finishOrders = exports.finishOrders = function finishOrders() {
  return Promise.try(() => {
    const curMessagePromise = utilRabbitmq.consumeQueueWith(productionQueue, updateOrderWithProducts);
    curMessagePromise.then((curMessage) => {
      console.log("CUR MESSAGE : ", curMessage);
    });
  });
};

const updateOrderWithSerialNumbers = function updateOrderWithSerialNumbers(newOrder) {
  return generateSerialNumbers(newOrder)
    .then((updatedOrder) => {
      return updateOrderFunc(updatedOrder);
    });
};

const updateOrderWithProducts = function updateOrderWithProducts(newOrder) {
  return productAllMinis(newOrder)
    .then((updatedOrder) => {
      return updateOrderFunc(updatedOrder);
    });
};

const updateOrderFunc = function updateOrderFunc(newOrder) {
  // console.log("UPDATE FUNC : ", newOrder);
  return request.patchAsync({
    uri: `http://127.0.0.1:1200/order/${newOrder._id}`,
    json: true,
    body: newOrder,
  }).then((result) => {
    if (result[0].statusCode !== 200) {
      // console.log(result[0]);
      throw "order not updated";
    }
    return result[1];
  });
};

const generateSerialNumbers = function generateSerialNumbers(newOrder) {
  // console.log("FROM MINI FACTORY : ", newOrder);
  return Promise.try(() => {
    const serialNumbers = new Array(newOrder.figuresQuantity);
    for (let i = 0; i < newOrder.figuresQuantity; i++) {
      serialNumbers[i] = new mongoose.Types.ObjectId();
    }
    newOrder.serialNumbersList = serialNumbers;
    newOrder.orderStatus = "being processed";
    // console.log(newOrder);
    return newOrder;
  });
};

const productAMini = function productAMini() {
  setTimeout(() => {
    console.log("Producing a MiNi");
  }, 1000);
};

const productAllMinis = function productAllMinis(newOrder) {
  const serialNumbers = new Array(newOrder.figuresQuantity);
  for (let i = 0; i < serialNumbers.length; i++) {
    return productAMini();
  }
  newOrder.orderStatus = "out for delivery";
  return newOrder;
};
