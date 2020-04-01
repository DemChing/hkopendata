const BaseComponent = require("./BaseComponent");
const Coordinate = require("./Coordinate");

class Lamppost extends BaseComponent {
    constructor(params) {
        super();
        this.assignClass(this, params);
        if ("coordinate" in this) {
            this.coordinate = new Coordinate(this.coordinate)
        }
        if ("coordinateHK" in this) {
            this.coordinateHK = new Coordinate(this.coordinateHK)
        }
        this.hasSensor();
    }
    hasSensor() {
        let item = {
            atmosphere: {
                temperature: false,
                humidity: false,
                radiation: false,
                pressure: false,
                wind: false
            },
            air: {
                particulate: false,
                pollutant: false,
            },
            camera: {
                vehicle: false,
                people: false
            },
            connection: {
                ble: false,
                rfid: false,
                nfc: false,
                gm: false,
                wifi: false
            }
        }
        for (let key in this.report) {
            let m;
            if (m = key.match(/^(temperature|wind|radiation|humidity|pressure)/)) {
                item.atmosphere[m[1]] = true;
            } else if (m = key.match(/^(vehicle|people)/)) {
                item.camera[m[1]] = true
            } else if (m = key.match(/^(particulate|pollutant)/)) {
                item.air[m[1]] = true
            } else if (m = key.match(/^(ib|eds|ble|rfid|nfc|gm|wifi)/)) {
                item.connection[m[1] == "ib" || m[1] == "eds" ? "ble" : m[1]] = true
            }
        }
        this.sensors = item;
    }
}

module.exports = Lamppost;