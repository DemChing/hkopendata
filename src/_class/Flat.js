const Location = require("./Location");

class Flat extends Location {
    constructor(params) {
        super();
        this.assignClass(this, params);
    }
}

module.exports = Flat;