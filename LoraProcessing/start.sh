#!/bin/bash
export PATH=/usr/local/bin:/bin:/usr/bin:/sbin:/usr/sbin
/home/pi/lora/LowCostLoRaGw/Raspberry/lora_gateway | node /home/pi/Projects/nodejs/LoraProcessing/index.js > /home/pi/loraprocessing.log 2>&1 &
