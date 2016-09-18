'use strict';

const clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
const Message = require('azure-iot-device').Message;
const querystring = require('querystring');
const util = require('util');

class IoTHubHandler {
    constructor(connString) {
        this.connString = connString;
        this.client = clientFromConnectionString(connString);
        this.isConnected = false;
    }
    
    publish(payloadString, callback) {
        
        if (!this.isConnected) {
            console.error('It\'s not connected');
        } else {            
            var message = new Message(payloadString);
            this.client.sendEvent(message, callback);
        }    
    }
    
    _printErrorFor(op) {
        return function printError(err) {
            if (err) console.log(op + ' error: ' + err.toString());
        };
    }

    _processC2dMessage(msg) {
        let data = msg.getData();
        try {
            var jsonPayload = JSON.parse(data);            
            console.log(jsonPayload);
            this.client.complete(msg, this._printErrorFor('complete'));
        }
        catch (err) {
            this._printErrorFor('Parse received message')(err);
            this.client.reject(msg, this._printErrorFor('reject'));
        }   
    }

    transformPayloadFrom(line) {

        let data = line;
        let now = new Date().toISOString();

        let payload = querystring.parse(data);
        let deviceId = payload.ID;
        delete payload["ID"];

        //try to parse numbers
        Object.getOwnPropertyNames(payload).forEach(function(key, idx, array) {
            //console.log(key + ' -> ' + payload[key]);
            try {
                payload[key] = parseFloat(payload[key]);
            } catch (err) {
            }
        });

        payload.deviceId = deviceId;
        payload.datetime = now;

        return payload;
    }

    processPayload(line) {

        if (!this.isConnected) {
            console.error("Not connected to Azure IoT Hub")
            return;
        }

        console.log('Received msg to log (\@) on Azure IoT Hub: ' + line);

        var payload = this.transformPayloadFrom(line);
        util.log(payload);

        this.publish(JSON.stringify(payload), function(err) {
            if (err) {
                console.error(err)
            } else {
                console.log("Data is published to Azure IoT Hub");
            }
        });
    }

    connect(callback) {
        console.log("Connecting to Azure IoT Hub...");
        var self = this;
        this.client.open(function(err) {
            if (err) {
                self.isConnected = false;
            }
            else {
                self.isConnected = true;
                //subscribe
                self.client.on('message', function (msg) { 
                    //console.log(msg);  
                    self._processC2dMessage(msg);                   
                }); 
            }
            callback(err);
        });
    }
}

module.exports = IoTHubHandler;