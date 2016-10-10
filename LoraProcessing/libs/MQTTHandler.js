'use strict';

const mqtt = require('mqtt')
, EventEmitter = require('events').EventEmitter;

class MQTTHandler extends EventEmitter{
    constructor(mqttConfig) {
        super();
        this.mqttConfig = mqttConfig;
        this.client = null;
        this.isConnected = false;
    }

    static get Events()  {
        return {
            CONNECTED: 'connected',
            NEWMESSAGE: 'newmessage',
            DISCONNECTED: 'disconnected',
            ERROR: 'error'
        }
    };

    publish(topic, payloadString, callback) {
        
        if (!this.isConnected) {
            console.error('It\'s not connected');
        } else {            
            this.client.publish(topic, payloadString, callback);
        }    
    }

    subscribe(topic) {
        this.client.subscribe(topic);
    }
    
    _processC2dMessage(topic, message) {
        //console.log(topic, message); 
        this.emit(MQTTHandler.Events.NEWMESSAGE, topic, message);
    }
    
    connect(callback) {
        //console.log("Connecting to MQTT Broker...");
        var self = this;
        //var mqttOpts = {
        //    port: this.mqttConfig.port,
        //    host: this.mqttConfig.host,
        //    keepalive: 5,
        //    clientId:this.mqttConfig.clientId,
        //    username: this.mqttConfig.username,
        //    password: this.mqttConfig.password
        //};
        //
        //if (this.mqttConfig.protocol) {
        //    mqttOpts.protocolId = this.mqttConfig.protocol;
        //}
        //
        //if (this.mqttConfig.protocolId) {
        //    mqttOpts.protocolId = this.mqttConfig.protocolId;
        //}

        var mqttOpts = this.mqttConfig;
        this.client = mqtt.connect(mqttOpts);
        
        this.client.on('connect', function() {
            //mqttClient.subscribe(MQTT_TOPIC_SUBSCRIBE);

            self.isConnected = true;
            //console.log('MQTT Connected');
            self.emit(MQTTHandler.Events.CONNECTED);
            if (callback) {
                callback(null);
            }
        });
        
        this.client.on('message', function(topic, message) {
            self._processC2dMessage(topic, message);
        });
        this.client.on('error', function(error) {
            self.isConnected = false;
            console.error(error);
        });
    }
}

module.exports = MQTTHandler;
