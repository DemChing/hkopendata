const cmn = require("../common");
const BaseComponent = require("./BaseComponent");

class Airline extends BaseComponent {
    constructor(icao) {
        super();
        let result = cmn.SearchDataJson("airlines", icao)[0];
        if (result) {
            this.assignClass(this, result)
        } else {
            this.icao = icao;
        }
    }
}

module.exports = Airline;