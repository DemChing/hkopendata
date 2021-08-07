const BaseComponent = require("./BaseComponent");
const cmn = require("../common");

class HKOStation extends BaseComponent {
    constructor(query, fallbackType) {
        super();

        if (typeof query === "string") {
            query[/^[A-Z0-9]{2,3}/.test(query) ? 'code' : 'name'] = query;
        }

        // 20210806: HKO use incorrect simplified chinese
        if (query.name) {
            query.name = query.name.trim().replace('鰂鱼涌', '鲗鱼涌');
        }

        let station = cmn.SearchDataJson("stations", query),
            type = "u";
        if (station.length === 0 && fallbackType) {
            station = cmn.SearchDataJson("stations", {
                ...query,
                type: fallbackType,
            })
        }
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
            type = Array.isArray(_type) ? _type[0] : _type;
        } else {
            if (typeof query === "string") {
                if (/^[A-Z0-9]{2,3}$/.test(query)) {
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

module.exports = HKOStation;