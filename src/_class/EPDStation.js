const BaseComponent = require("./BaseComponent");
const cmn = require("../common");

class EPDStation extends BaseComponent {
    constructor(query) {
        super();

        if (typeof query === "string") {
            query = {
                [/^[A-Z]{2,3}/.test(query) ? 'code' : 'name']: query
            };
        }

        let station = cmn.SearchDataJson("aqhi", query),
            type = "u";
        if (station.length > 0) {
            let {
                code,
                name,
                type: _type
            } = station[0];
            for (let key in name) {
                if (Array.isArray(name[key])) name[key] = name[key][0];
            }
            this.assignClass(this, {
                code,
                name
            });
            type = _type;
        } else {
            if (typeof query === "string") {
                if (/^[A-Z]{2,3}$/.test(query)) {
                    this.code = query;
                } else {
                    this.name = query;
                }
            } else if (query.code) {
                this.code = query.code;
            } else if (query.name) {
                this.name = query.name;
            }
        }
        this.type = type;
    }
}

module.exports = EPDStation;