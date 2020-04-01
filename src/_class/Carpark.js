const moment = require("../moment");
const BaseComponent = require("./BaseComponent");
const Coordinate = require("./Coordinate");
const Location = require("./Location");
const utils = require("../utils");

class Carpark extends BaseComponent {
    constructor(params) {
        super();
        this.assignClass(this, params);
        for (let key in this) {
            if (key == "opening") {
                this[key] = this[key].map(v => new CarparkRule(v));
            } else if (/^(privateCar|LGV|HGV|coach|motorCycle)$/.test(key)) {
                if (!("carTypes" in this)) this.carTypes = [];
                if (Array.isArray(this[key])) {
                    this[key] = this[key][0]
                }
                this.carTypes.push(new CarparkCarType(this[key], key));
                delete this[key];
            } else if (/lastUpdate|createAt|Date/.test(key)) {
                this[key] = moment(this[key]).format("YYYY-MM-DD HH:mm:ss")
            }
        }
        if ("address" in this) {
            this.address = new Location(this.address);
            if ("district" in this && "district" in this.address) delete this.district;
        }
        if ("displayAddress" in this) {
            if ("address" in this) delete this.displayAddress;
        }
        if ("coordinates" in this) {
            this.coordinate = new Coordinate({
                longitude: this.coordinates[0],
                latitude: this.coordinates[1]
            })
            delete this.coordinates;
        }
    }
    hasNumber(key, carType, type) {
        return carType ? this.carTypes.reduce((p, c) => p || (c.is(carType) ? c.hasNumber(key, type) : false), false) : this.carTypes.reduce((p, c) => p || c.hasNumber(key, type), false)
    }
    hasSpace(carType, type) {
        return this.hasNumber("space", carType, type);
    }
    hasVacancy(carType, type) {
        return this.hasNumber("vacancy", carType, type);
    }
}
class CarparkCarType extends BaseComponent {
    constructor(params, type) {
        super();
        this.type = type;
        let data = {},
            rename = {
                "category": "charges",
                "lastupdate": "lastUpdate",
            };
        for (let key in params) {
            let m;
            if (/^(hourlyCharges|monthlyCharges|privileges|dayNightParks|unloadings)$/.test(key)) {
                params[key] = params[key].map(v => new CarparkRule(v));
            } else if (m = key.match(/(space|vacancy)([A-z]+)?/)) {
                if (!(m[1] in data)) data[m[1]] = {};
                if (key == "vacancy_type") data[m[1]].actual = params[key] != "B"
                else if (typeof m[2] === "undefined") data[m[1]].total = params[key];
                else if (params[key] > 0) data[m[1]][m[2].toLowerCase()] = params[key];
                delete params[key]
            } else if (key in rename) {
                if (key == "category") params[key] = params[key].toLowerCase();
                params[rename[key]] = params[key];
                delete params[key];
            }
        }
        for (let key in data) {
            params[key] = new CarparkNumbers(data[key], key);
        }
        this.assignClass(this, params);
    }
    hasNumber(key, type) {
        if (key in this) {
            return !this[key].isEmpty(type)
        }
        return false;
    }
    hasVacancy(type) {
        return this.hasNumber("vacancy", type);
    }
    hasSpace(type) {
        return this.hasNumber("space", type);
    }
}
class CarparkRule extends BaseComponent {
    constructor(params) {
        super();
        if ("periodStart" in params && "periodEnd" in params) {
            params.period = `${params.periodStart}-${params.periodEnd}`;
            if (params.period == "00:00-00:00") {
                params.period = "00:00-24:00";
            }
        }
        if ("weekdays" in params) {
            params.available = params.weekdays.map((day) => day.toLowerCase());
            delete params.weekdays;
        }
        if ("remark" in params) {
            params.remarks = params.remark;
            delete params.remark;
        }
        if ("reserved" in params) {
            params.reserved = params.reserved == "reserved"
        }
        delete params.periodStart;
        delete params.periodEnd;

        this.assignClass(this, params);
    }
    isAvailabe(date) {
        let valid = true;
        date = date ? moment(date) : moment();
        valid = valid && isAvailabeDate(date) && isAvailabeTime(date)
        return valid
    }
    isAvailabeDate(date) {
        date = date ? moment(date) : moment();
        return this.weekdays.indexOf(date.format("ddd")) != -1
    }
    isAvailabeTime(date) {
        date = date ? moment(date) : moment();
        let start = moment(date.format("YYYYMMDD") + this.periodStart, "YYYYMMDDHHmm"),
            end = moment(date.format("YYYYMMDD") + this.periodEnd, "YYYYMMDDHHmm");
        return date.isBetween(start, end, null, "[]")
    }
    toLocale(lang) {
        let locale = super.toLocale(lang);
        if (!("validUntilEnd" in this)) return locale;
        let key = utils.ToLocale("validUntil", lang, this.constructor.name.toLowerCase());
        locale[key] += locale.validUntilEnd;
        delete locale.validUntilEnd;
        return locale;
    }
}

class CarparkNumbers extends BaseComponent {
    constructor(params, type) {
        super();
        this.assignClass(this, params);
        this._type = type;
    }
    isEmpty(type) {
        if (!type) return this.total == 0;
        else if (type in this) return this[type] == 0;
        return true
    }
    toLocale(lang) {
        let locale, isActual = !("actual" in this) || ("actual" in this && this.actual);
        if (Object.keys(this).filter(v => !/total|_type|actual/.test(v) && this[v] > 0).length == 0) {
            if (this.total > 0) return isActual ? this.total : `${this.total}+`;
            else return 0;
        }
        locale = super.toLocale(lang);
        delete locale.actual;
        return locale;
    }
}

module.exports = Carpark;