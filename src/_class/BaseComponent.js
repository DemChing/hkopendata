const cmn = require("../common");
const utils = require("../utils");

class BaseComponent {
    constructor() {}
    assignClass(self, params) {
        for (let key in params) {
            self[key] = params[key]
        }
    }

    getLang(item) {
        return utils.GetAvailableLang(typeof item === "string" ?  this[item] : typeof item === "object" ? item : this)
    }

    getLocale(item, lang) {
        let obj;
        if (typeof item === "object") {
            obj = item;
        } else if (item in this) obj = this[item];
        else return "";

        if (typeof obj === "string") return obj;
        if (typeof lang === "undefined") {
            if ("en" in obj) lang = "en";
            else lang = this.getLang(obj)[0];
        }
        return obj[lang];
    }

    toLocale(lang) {
        let pack = this.constructor.name.toLowerCase(),
            locale = utils.ToLocale(this, lang, pack);
        for (let key in locale) {
            if (/^_/.test(key) || locale[key] === "") {
                delete locale[key];
            }
        }
        return locale;
    }

    is(type) {
        return "_type" in this ? this._type == type : "type" in this ? this.type == type : false;
    }

    add(itemName, item) {
        if (!(itemName in this)) this[itemName] = [];
        this[itemName].push(item);
        return item;
    }

    find(itemName, params) {
        if (typeof params === "string") params = {
            name: params
        };
        return !itemName in this ? [] : this[itemName].filter((item) => {
            let valid = true;
            for (let key in params) {
                if (valid && key in item) {
                    valid = valid && cmn.Equal(item[key], params[key]);
                }
            }
            return valid;
        })
    }

}

module.exports = BaseComponent;