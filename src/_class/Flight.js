const BaseComponent = require("./BaseComponent");
const Airport = require("./Airport");
const Airline = require("./Airline");

class Flight extends BaseComponent {
    constructor(params) {
        super();
        if ("statusCode" in params) {
            params._statusCode = params.statusCode;
            delete params.statusCode;
        }
        this.assignClass(this, params);
        if ("origin" in this) {
            this.origin = this.origin.map((iata) => new Airport(iata))
        }
        if ("destination" in this) {
            this.destination = this.destination.map((iata) => new Airport(iata))
        }
        this.flight.map((v, j) => {
            this.flight[j].airline = new Airline(v.airline)
        })
    }
}

module.exports = Flight;