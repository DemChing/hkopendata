const Location = require("./Location");
const Building = require("./Building");

class Estate extends Location {
    constructor(params) {
        super();
        this.assignClass(this, params);
        this.buildings = this.buildings || [];
    }

    addBuilding(params) {
        let building = new Building({
            ...params,
            ...{
                region: this.region,
                district: this.district,
                estate: this.name,
            }
        });
        return this.add("buildings", building);
    }

    findBuilding(params) {
        return this.find("buildings", params)
    }
}

module.exports = Estate;