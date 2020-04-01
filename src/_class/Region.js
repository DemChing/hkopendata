const Location = require("./Location");
const District = require("./District");

class Region extends Location {
    constructor(params) {
        super();
        this.assignClass(this, params);
        this.districts = this.districts || [];
    }

    addDistrict(params) {
        let district = new District({
            ...params,
            ...{
                region: this.name,
            }
        });
        return this.add("districts", district);
    }

    findDistrict(params) {
        return this.find("districts", params)
    }
}

module.exports = Region;