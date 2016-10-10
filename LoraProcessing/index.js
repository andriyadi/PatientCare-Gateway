'use strict';

const wpi = require('wiring-pi');
const config = require('./config');
const util = require('util');
const readline = require('readline');
const IoTHubHandler = require('./libs/IoTHubHandler');
const SensorOledDisplay = require('./libs/SensorOledDisplay');
const MQTTMakestroCloudHandler = require('./libs/MQTTMakestroCloudHandler');
const ArtikMQTTHandler = require('./libs/ArtikMQTTHandler');

wpi.setup('wpi');
wpi.pinMode(config.gpio.indicatorPin, wpi.OUTPUT);
wpi.digitalWrite(config.gpio.indicatorPin, 0); //active high
//show once
gotValidData();

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

// Begin of Signal Debugging
const PKT_TYPE_DATA = 0x10;
const PKT_TYPE_ACK = 0x20;
const PKT_FLAG_ACK_REQ = 0x08;
const PKT_FLAG_DATA_ENCRYPTED = 0x04;
const PKT_FLAG_DATA_WAPPKEY = 0x02;
const PKT_FLAG_DATA_ISBINARY = 0x01;

function processControlPacketInfo(line) {

    var rawFormat = false;
    var dst, src, seq, datalen, SNR, RSSI;
    var ptype, ptypestr;
    var info_str;

    //console.log("===> " + line);
    var pkgs = line.split(",");
    //console.log(parseInt(pkgs[1]));
    //console.log(parseInt(pkgs[1]) & 0xF0);
    ptype = parseInt(pkgs[1]);
    ptypestr = "N/A";
    
    if ((ptype & 0xF0) == PKT_TYPE_DATA) {
        //console.log('DATA >> ' + line);
        ptypestr="DATA"
        if ((ptype & PKT_FLAG_DATA_ISBINARY) == PKT_FLAG_DATA_ISBINARY)
            ptypestr = ptypestr + " IS_BINARY"
        if ((ptype & PKT_FLAG_DATA_WAPPKEY) == PKT_FLAG_DATA_WAPPKEY)
            ptypestr = ptypestr + " WAPPKEY"
        if ((ptype & PKT_FLAG_DATA_ENCRYPTED) == PKT_FLAG_DATA_ENCRYPTED)
            ptypestr = ptypestr + " ENCRYPTED"
        if ((ptype & PKT_FLAG_ACK_REQ) == PKT_FLAG_ACK_REQ)
            ptypestr = ptypestr + " ACK_REQ"
            
        if ((ptype & 0xF0) == PKT_TYPE_ACK) { 
			ptypestr="ACK"				
        }	
        
        dst = pkgs[0];
        src = pkgs[2];
        seq = pkgs[3];
        datalen = pkgs[4];
        SNR = pkgs[5];
        RSSI = pkgs[6];
        
        if (rawFormat === false)
            info_str = util.format("(dst=%d type=%d(%s) src=%d seq=%d len=%d SNR=%d RSSI=%d)", dst,ptype,ptypestr,src,seq,datalen,SNR,RSSI);
        else
            info_str = util.format("rawFormat(len=%d SNR=%d RSSI=%d)", datalen,SNR,RSSI);
            
        console.log(info_str);
    }      
}
//End of Signal Debugging

var sensorDisplay;
if (config.display.oledEnabled) {
    sensorDisplay = new SensorOledDisplay();
}

var iotHubHandler = null;
if (config.iothub.activated) {
    iotHubHandler = new IoTHubHandler(config.iothub.connectionString);
    iotHubHandler.connect(function (err) {
        if (err) console.error(err)
        else {
            console.log("Connected to IoT Hub");
        }
    })
}

var mqttMakestroCloudHandler = null;
if (config.makestro.activated) {
    if (mqttMakestroCloudHandler == null) {
        mqttMakestroCloudHandler = new MQTTMakestroCloudHandler(config);
        mqttMakestroCloudHandler.begin();
    }
}

var artikMqttHandler = null;
if (config.artik.activated) {
    if (artikMqttHandler == null) {
        artikMqttHandler = new ArtikMQTTHandler(config);
        artikMqttHandler.begin();
    }
}

function gotValidData() {
    var value = 0;
    var count = 0;
    
    let intId = setInterval(function() {
        if (count > 3) {
            clearInterval(intId);
            return;    
        }
        
        wpi.digitalWrite(config.gpio.indicatorPin, value);
        //console.log(value? "ON": "OFF");
        value = +!value;
        count++;
        
    }, 300);
}

function processLine(line) {
    var firstChar = line[0];
    var secondChar = line[1];
    //console.log(">>>" + firstChar);
    
    if (firstChar == '�') {
        firstChar = secondChar;
        secondChar = line[2];
        line = line.substring(1, line.length);
    }
    
    if (firstChar == '^') {
		if (secondChar == 'p') {
            processControlPacketInfo(line.substring(2, line.length));
        }	
    }
    
    else if (firstChar == '\\') {
        gotValidData(); //blink led when a valid package received
        
		if (secondChar == '@' && config.iothub.activated) {
            iotHubHandler.processPayload(line.substring(2, line.length));
        }
        else if (secondChar == '#' && config.makestro.activated) {
            mqttMakestroCloudHandler.processPayload(line.substring(2, line.length));
        }
        else if (secondChar == '%' && config.artik.activated) {
            artikMqttHandler.processPayload(line.substring(2, line.length));
        }
    }
}

rl.on('line', function(line){
    //console.log(line);
    processLine(line);
})

