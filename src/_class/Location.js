const BaseComponent = require("./BaseComponent");
const Coordinate = require("./Coordinate");
const utils = require("../utils");

class Location extends BaseComponent {
    constructor(params) {
        super();
        this.assignClass(this, params);
        if ("coordinate" in this) {
            this.coordinate = new Coordinate(this.coordinate)
        }
        if ("coordinateHK" in this) {
            this.coordinateHK = new Coordinate({
                ...this.coordinateHK,
                ...{
                    _type: "tmerc",
                    _system: "hk1980"
                }
            })
        }
    }
    formatData(lang) {
        if (typeof lang === "undefined") lang = "en";
        return {
            flat: this.formatFlat(lang),
            floor: this.formatFloor(lang),
            block: this.formatBlock(lang),
            building: this.formatBuilding(lang),
            phase: this.formatPhase(lang),
            estate: this.formatEstate(lang),
            village: this.formatVillage(lang),
            street: this.formatStreet(lang),
            location: this.formatLocation(lang),
            district: this.formatDistrict(lang),
            region: this.formatRegion(lang)
        }
    }
    formatAddress(lang, formatted) {
        if (typeof lang === "undefined") lang = "en";
        let address = "",
            lines = [
                [],
                [],
                [],
                [],
                []
            ],
            format = this.formatData(lang),
            delim = " ";
        if (lang == "en") delim = ", ";
        for (let key in format) {
            let i = -1;
            if (key == "flat" || key == "floor") i = 0;
            else if (key == "block" || key == "building") i = 1;
            else if (key == "estate" || key == "phase") i = 2;
            else if (key == "street" || key == "village") i = 3;
            else if (key == "location" || key == "region") i = 4;
            if (i >= 0) {
                lines[i].push(format[key]);
            }
        }
        if (lang != "en") {
            lines = lines.map(v => v.reverse()).reverse()
        }
        address = lines.map(v => v.filter(u => u != "")).filter(v => v.length > 0).map(v => v.join(delim))
        address = address.join(!formatted ? delim : "\n");
        return address.toUpperCase();
    }
    formatFlat(lang) {
        if (!("flat" in this)) return "";
        if (typeof lang === "undefined") lang = "en";
        return lang == "en" ? ("Flat " + this.flat) : (this.flat + "室")
    }
    formatFloor(lang) {
        if (!("floor" in this)) return "";
        if (typeof lang === "undefined") lang = "en";
        return lang == "en" ? (this.floor + "/F") : (this.floor + "樓")
    }
    formatBlock(lang) {
        if (!("block" in this)) return "";
        if (typeof lang === "undefined") lang = this.getLang("block")[0];
        if (typeof this.block === "string") return this.block;
        let indicator = false,
            no = this.getLocale(this.block.no, lang),
            desc = this.getLocale(this.block.descriptor, lang);
        if (lang == "en" && "indicator" in this.block && this.block.indicator) indicator = true;
        return indicator ? `${desc} ${no}` : `${no}${desc}`
    }
    formatBuilding(lang) {
        return this.getLocale("building", lang);
    }
    formatPhase(lang) {
        let phase = this.getLocale("phase", lang);
        if (phase == "") return "";
        if (typeof lang === "undefined") lang = this.getLang("phase")[0];
        if ("no" in this.phase) {
            phase = lang == "en" ? (phase + " " + this.phase.no) : (this.phase.no + phase)
        }
        return phase;
    }
    formatEstate(lang) {
        return this.getLocale("estate", lang);
    }
    formatVillageOrStreet(lang, village) {
        let key = "street";
        if (village) key = "village";
        let no = "",
            value = this.getLocale(key, lang);
        if (value == "") return "";
        if (typeof lang === "undefined") lang = this.getLang(key)[0];
        if (typeof this[key] === "object" && "from" in this[key]) {
            no = this[key].from;
            if ("to" in this[key]) no += "-" + this[key].to;
        } else if ("buildingNo" in this) {
            no = this.buildingNo;
        }
        if (no != "") {
            no = lang == "en" ? `no.${no} ` : `${no}號`;
        }
        value = lang == "en" ? (`${no}${value}`) : (`${value}${no}`)
        return value;
    }
    formatVillage(lang) {
        return this.formatVillageOrStreet(lang, true)
    }
    formatStreet(lang) {
        return this.formatVillageOrStreet(lang)
    }
    formatLocation(lang) {
        return this.getLocale("location", lang);
    }
    formatDistrict(lang) {
        return this.getLocale("district", lang);
    }
    formatRegion(lang) {
        return this.getLocale("region", lang);
    }
    toLocale(lang) {
        let locale = super.toLocale(lang), item = {};
        if (!("street" in this || "block" in this)) return locale;
        if ("street" in item) {
            item.street = this.formatStreet(lang);
        }
        if ("block" in item) {
            item.block = this.formatBlock(lang);
        }
        for (let key in item) {
            if (item[key] == "") delete item[key];
        }
        return {
            ...locale,
            ...utils.ToLocale(item, lang, this.constructor.name.toLowerCase())
        };
    }
}

module.exports = Location;