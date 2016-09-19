#!/bin/bash
export PATH=/usr/local/bin:/bin:/usr/bin:/sbin:/usr/sbin
/home/pi/lora/PatientCare-Gateway/LoRaGateway/lora_gateway | node /home/pi/lora/PatientCare-Gateway/LoraProcessing/index.js > /home/pi/lora/PatientCare-Gateway/loraprocessing.log 2>&1 &