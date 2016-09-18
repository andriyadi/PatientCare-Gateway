'use strict';

var config = {};


config.backends = {
    IOTHUB: 0,
    MQTT: 1
};

config.defaultBackend = config.backends.IOTHUB;

//Put connection string to Azure IoTHub of already registered device. I know I know, it's not really scalable for now.
config.iothub = {
    connectionString: 'HostName=Azure-IoT-camp-demo.azure-devices.net;DeviceId=beastmaster-01;SharedAccessKey=Y0BtJHQRiNg2sTRzxsX3lJwXYbMsdegkPgeNM3OMOv0='
};

config.gpio = {
    indicatorPin: 29
}

config.display = {
    oledEnabled: true
}

module.exports = config;
