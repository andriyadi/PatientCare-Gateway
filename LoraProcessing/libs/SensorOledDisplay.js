/**
 * Created by andri on 7/18/16.
 */
'use strict';

//const pngtolcd = require('png-to-lcd');
const Oled = require('edison-ssd1306');

class SensorOledDisplay {
    constructor() {
        this.oled = new Oled();
        this.oled.clear();
    }

    display(payload) {
        this.oled.clear();
        if (payload.T) {
            this.oled.setTextSize(1);
            this.oled.print('Temp:');
            this.oled.setTextSize(3);
            this.oled.printAt(payload.T + "", 0, 20);
        }
        this.oled.display();
    }
}

module.exports = SensorOledDisplay;