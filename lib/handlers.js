"use strict";

const Promise = require("bluebird");
const request = Promise.promisifyAll(require("request").defaults({jar: true}), {
  filter: (funcName) => { return /put|patch|post|head|del(ete)?|get/.test(funcName); },
  multiArgs: true,
});
const mongoose = require("mongoose");
const plugins = require("restify").plugins;
const Denque = require("denque");
const amqplib = require("amqplib");
const amqp = require("amqplib/callback_api");
// const utils = require("./util");

const utilRabbitmq = require("rabbitmq-utils");
const { all } = require("bluebird");

const ordersQueue = new Denque();
const currentQueue = "orders-queue";
const productionQueue = "productionQueue";

exports.bodyParser = plugins.bodyParser({maxBodySize: 50000});

//rpc_server
const handleOrder = exports.handleOrder = function handleOrder() {
	amqp.connect("amqp://localhost", function(error0, connection) {
    if(error0) { throw error0; }
    connection.createChannel(function(error1, channel) {
        if(error1) { throw error1; }

        channel.assertQueue(currentQueue, { durable: false });
        channel.prefetch(1);
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C ", currentQueue);
        channel.consume(currentQueue, (orderMessage) => {
            const messageReceived = orderMessage.content.toString();
            console.log(" [x] Received : ", messageReceived);
            const messageTreated = generateSerialNumbers(JSON.parse(messageReceived));
            console.log(" [x] Treated : ", messageTreated);
            channel.sendToQueue(productionQueue,
                Buffer.from(JSON.stringify(messageTreated)),
                { correlationId: orderMessage.properties.correlationId,
            });
            
        }, { noAck: false });
    });
});
};

const handleOrders = exports.handleOrders = function handleOrders() {
    return Promise.try(() => {
        // const allOrders = [];
        const curMessagePromise = utilRabbitmq.consumeQueueWith(currentQueue, updateOrderWithSerialNumbers);
        curMessagePromise.then((curMessage) => {
            console.log("CUR MESSAGE : ", curMessage);
            // return generateSerialNumbers(curMessage);
            
        });       
        
    });
};

const updateOrderWithSerialNumbers = function updateOrderWithSerialNumbers(newOrder) {
    return generateSerialNumbers(newOrder)
        .then((updatedOrder) => { 
            return updateOrderFunc(updatedOrder); 
        });
};

const updateOrderFunc = function updateOrupdateOrderFuncder(newOrder) {
    // console.log("UPDATE FUNC : ", newOrder);
    return request.patchAsync({
        uri: "http://127.0.0.1:1200/order/"+ newOrder._id,
        json: true,
        body: newOrder,
    }).then((result) => { 
        if(result[0].statusCode !== 200) {
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
        for(let i = 0; i < newOrder.figuresQuantity; i++) {
            serialNumbers[i] = new mongoose.Types.ObjectId();	
        }
        newOrder.serialNumbersList = serialNumbers;
        newOrder.orderStatus = "being processed";
        // console.log(newOrder);
        return newOrder;
    });    
};

const productAMini = function productAMini() {
    setTimeout(() => {return}, 1000);
};

const productAllMinis = function productAllMinis(newOrder) {
    const serialNumbers = new Array(newOrder.figuresQuantity);
	for(let i = 0; i < serialNumbers.length; i++) {
        productAMini();
    }
    newOrder.orderStatus = "out for delivery";
    return newOrder;
};

exports.sendData = function sendData(req, res, next) {
    res.header("Connection", "close");
    res.status(200);
    res.json(res.data);
    return next();
  };
