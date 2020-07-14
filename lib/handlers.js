"use strict";

const Promise = require("bluebird");
const request = Promise.promisifyAll(require("request").defaults({jar: true}), {
  filter: (funcName) => { return /put|patch|post|head|del(ete)?|get/.test(funcName); },
  multiArgs: true,
});
const mongoose = require("mongoose");
const plugins = require("restify").plugins;
const Denque = require("denque");
const amqp = require("amqplib/callback_api");
// const utils = require("./util");
const ordersQueue = new Denque();
const currentQueue = "factoryQueue";
const productionQueue = "productionQueue";

exports.bodyParser = plugins.bodyParser({maxBodySize: 50000});

exports.enqueueOrder = function enqueueOrder(req, res, next) {
    return Promise.try(() => {
	const newOrder = req.body;
	const serialNumbers = new Array(newOrder.figuresQuantity);
	for(let i = 0; i < serialNumbers.length; i++) {
		serialNumbers[i] = new mongoose.Types.ObjectId();	
	}
	newOrder.serialNumbersList = serialNumbers;
	newOrder.orderStatus = "being processed";
	ordersQueue.push(newOrder);
	res.data = newOrder;
	}).catch();
};
//rpc_server
const handleOrder = exports.handleOrder = function handleOrder() {
	amqp.connect("amqp://localhost", function(error0, connection) {
    if(error0) { throw error0; }
    connection.createChannel(function(error1, channel) {
        if(error1) { throw error1; }

        channel.assertQueue(currentQueue, { durable: true });
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

const finishOrder = exports.finishOrder = function finishOrder() {
	amqp.connect("amqp://localhost", function(error0, connection) {
    if(error0) { throw error0; }
    connection.createChannel(function(error1, channel) {
        if(error1) { throw error1; }

        channel.assertQueue(productionQueue, { durable: true });
        channel.prefetch(1);
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C ", currentQueue);
        channel.consume(productionQueue, (orderMessage) => {
            const messageReceived = orderMessage.content.toString();
            console.log(" [x] Received : ", messageReceived);
            const messageTreated = productAllMinis(JSON.parse(messageReceived));
            console.log(" [x] Treated : ", messageTreated);
            channel.sendToQueue(orderMessage.properties.replyTo,
                Buffer.from(JSON.stringify(messageTreated)),
                { correlationId: orderMessage.properties.correlationId,
            });
            
        }, { noAck: false });
    });
});
};

const generateSerialNumbers = function generateSerialNumbers(newOrder) {
	const serialNumbers = new Array(newOrder.figuresQuantity);
	for(let i = 0; i < serialNumbers.length; i++) {
		serialNumbers[i] = new mongoose.Types.ObjectId();	
	}
	newOrder.serialNumbersList = serialNumbers;
    newOrder.orderStatus = "being processed";
    return newOrder;
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
