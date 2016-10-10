'use strict';

var config = {};

config.backends = {
    IOTHUB: 0,
    MQTT: 1
};

config.defaultBackend = config.backends.IOTHUB;

//Put connection string to Azure IoTHub of already registered device. I know I know, it's not really scalable for now.
config.iothub = {
    connectionString: 'HostName=Azure-IoT-camp-demo.azure-devices.net;DeviceId=beastmaster-01;SharedAccessKey=[USE_YOUR_OWN]',
    activated: false
};

config.makestro = {
    mqtt : {
        host: "iotid.cloudapp.net",
        port: 1883,
        clientId: "andri-tricorder-LoraStation01",
        username: "andri",
        password: "[USE_YOUR_OWN]"
    },
    fifoFile: "/tmp/lora_fifo_iothubid",
    subscribedTopic: 'andri/tricorder/control',
    publishTopic: 'andri/tricorder/data',
    activated: false
}

config.artik = {
    mqtt : {
        host: "api.artik.cloud",
        port: 8883,
        clientId: "PatientCareGateway-01",
        username: "3c85aeff55b245139ad3f0b9b327a351",
        password: "[USE_YOUR_OWN]",
        protocol: 'mqtts',
        //protocolId: 'MQIsdp',
        secureProtocol: 'TLSv1_2_method',
    },
    fifoFile: "/tmp/lora_fifo_artik",
    deviceId: "3c85aeff55b245139ad3f0b9b327a351",
    subscribedTopic: '/v1.1/actions',
    publishTopic: '/v1.1/messages',
    activated: true
}

config.gpio = {
    indicatorPin: 29
}

config.display = {
    oledEnabled: true
}

module.exports = config;
