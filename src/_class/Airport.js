const cmn = require("../common");
const BaseComponent = require("./BaseComponent");
const Coordinate = require("./Coordinate");

class Airport extends BaseComponent {
    constructor(iata) {
        super();
        let result = cmn.SearchDataJson("airports", iata)[0];
        if (result) {
            this.assignClass(this, result)
            this.coordinate = new Coordinate({
                longitude: this.long,
                latitude: this.lat
            })
            delete this.long;
            delete this.lat;
        } else {
            this.iata = iata;
        }
    }
}

module.exports = Airport;