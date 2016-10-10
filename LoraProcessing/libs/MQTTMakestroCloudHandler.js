/**
 * Created by andri on 7/28/16.
 */

'use strict';

const MQTTHandler = require('./MQTTHandler');
//const ButtonOledDisplay = require('./ButtonOledDisplay');
const querystring = require('querystring');
const fs = require('fs');
const util = require('util');

const KEY_PROP_MAP = {
    "T": "topic",
    //"BC": "buttoncount",
    "ID": "deviceId",
    "N": "nodeaddress",
    //"V": "voltage",
    //"S": "status",
    //"RQID": "requestid",
    //"BID": "buttonid",
    //"TY": "type",
    //"I": "indicator",
    //"DT": "datetime",
    //"RPID": "responseid"
}

class MQTTMakestroCloudHandler extends MQTTHandler {
    constructor(config) {
        super(config.makestro.mqtt);
        this.config = config;

        this.nodesMap = new Map();

        this.keyPropMap = new Map();//KEY_PROP_MAP);
        for (let k of Object.keys(KEY_PROP_MAP)) {
            this.keyPropMap.set(k, KEY_PROP_MAP[k]);
        }

        //if (config.display.oledEnabled) {
        //    this.buttonDisplay = new ButtonOledDisplay();
        //}
    }

    _getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }

    _proceedResponseMessage(topic, message) {
        var self = this;

        var jsonMsg = JSON.parse(message.toString());
        delete jsonMsg["datetime"];

        //get button id
        //var parts = topic.split("/");
        //if (parts.length < 3) {
        //    return;
        //}
        //
        //var deviceId = parts[1];

        var deviceId = jsonMsg.device_id;
        var nodeObj;

        if (!self.nodesMap.has(deviceId)) {
            console.error("NO NODE OBJECT");
            //return;

            //get first
            var iter = self.nodesMap.values();
            nodeObj = iter.next().value;
        }
        else {
            nodeObj = self.nodesMap.get(deviceId);
        }

        if (!nodeObj) {
            console.error("NO NODE OBJECT FOUND");
            return;
        }

        util.log(nodeObj);
        if (!nodeObj.nodeaddress) {
            console.error("NO NODE ADDRESS PROP");
            return;
        }

        var newJsonMsg = {};
        Object.getOwnPropertyNames(jsonMsg).forEach(function(prop, idx, array) {
            console.log(prop + ' -> ' + jsonMsg[prop]);
            try {

                var theKey = self._getKeyByValue(KEY_PROP_MAP, prop);
                //console.log(prop + ' -> ' + theKey);
                newJsonMsg[theKey] = jsonMsg[prop];

            } catch (err) {
            }
        });

        //write fifo
        var fifoMsg = "/" + nodeObj.nodeaddress + "/" + querystring.stringify(newJsonMsg) + "&T=" + topic;
        util.log("FIFO msg: " + fifoMsg);

        this.fifoStream.write(fifoMsg);
    }

    begin() {
        var self = this;
        this.addListener(MQTTHandler.Events.CONNECTED, function() {
            self.subscribe(self.config.makestro.subscribedTopic);
        });

        this.fifoStream = fs.createWriteStream(self.config.makestro.fifoFile);
        this.addListener(MQTTHandler.Events.NEWMESSAGE, function(topic, message) {
            console.log("Topic: " + topic);
            console.log(message.toString());

            //if (topic.indexOf("/response") < 0) {
            //    return;
            //}

            self._proceedResponseMessage(topic, message);

        });

        if (!this.isConnected) {
           this.connect()
        }
    }

    transformPayloadFrom(line) {
        var self = this;
        let data = line;
        let now = new Date().toISOString();

        let payload = querystring.parse(data);
        //let deviceId = payload.ID;
        //delete payload["ID"];

        var newPayload = {};
        //try to parse numbers
        Object.getOwnPropertyNames(payload).forEach(function(key, idx, array) {
            //console.log(key + ' -> ' + payload[key]);
            try {
                var val = parseFloat(payload[key]);
                if (!isNaN(val)) {
                    payload[key] = val;
                }

                var theProp = self.keyPropMap.get(key);
                if (theProp) {
                    //console.log(key + ' -> ' + theProp);
                    newPayload[theProp] = payload[key];
                }
                else {
                    newPayload[key] = payload[key];
                }

            } catch (err) {
            }
        });

        //payload.deviceId = deviceId;
        //payload.datetime = now;
        newPayload["datetime"] = now;

        //return payload;
        return newPayload;
    }

    _addNode(obj) {
        if (!obj.deviceId) {
            return;
        }

        if (this.nodesMap.has(obj.deviceId)) {
            return;
        }

        this.nodesMap.set(obj.deviceId, obj);
        util.log("Added node " + obj.deviceId);
    }

    processPayload(line) {
        if (!this.isConnected) {
            util.error("NOT CONNECTED")
            return;
        }

        console.log('rcv msg to log (\@) on Makestro Cloud: ' + line);

        var payload = this.transformPayloadFrom(line);
        util.log(payload);

        if (this.buttonDisplay) {
            this.buttonDisplay.display(payload);
        }

        this._addNode(payload);

        var topic = "andri/tricorder/data";//payload.topic;
        if (!topic) {
            topic = this.config.makestro.publishTopic;
        }
        util.log(topic);

        this.publish(topic, JSON.stringify(payload), function(err) {
            if (err) {
                console.error(err)
            } else {
                console.log("Data is published to Makestro Cloud");
            }
        });
    }
}

module.exports = MQTTMakestroCloudHandler

