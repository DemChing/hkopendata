const Location = require("./Location");
const Flat = require("./Flat");

class Building extends Location {
    constructor(params) {
        super();
        this.assignClass(this, params);
        this.floors = this.floors || [];
    }

    addFlat(params) {
        let flat = new Flat({
            ...params,
            ...{
                region: this.region,
                district: this.district,
                estate: this.estate,
                building: this.name,
            }
        });
        return this.add("flats", flat);
    }

    findFlat(params) {
        return this.find("flats", params)
    }
}

module.exports = Building;