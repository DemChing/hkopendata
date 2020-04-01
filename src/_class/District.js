const Location = require("./Location");
const Estate = require("./Estate");

class District extends Location {
    constructor(params) {
        super();
        this.assignClass(this, params);
        this.estates = this.estates || [];
    }

    addEstate(params) {
        let estate = new Estate({
            ...params,
            ...{
                region: this.region,
                district: this.name,
            }
        });
        return this.add("estates", estate);
    }

    findEstate(params) {
        return this.find("estates", params)
    }
}

module.exports = District;