const utils = require('../utils');
const BaseComponent = require("./BaseComponent");

const DirectionRegex = {
    n: "n(orth)?|北",
    s: "s(outh)?|南",
    e: "e(ast)?|東|东",
    w: "w(est)?|西",
}

class Direction extends BaseComponent {
    constructor(params) {
        super();
        let ver = "",
            hor = "";
        if (typeof params === "string" && /^(n(orth)?|s(outh)?|e(ast)?|w(est)?|[東南北东西 ])+$/i.test(params)) {
            for (let key in DirectionRegex) {
                params = params.replace(new RegExp(DirectionRegex[key], "i"), key);
            }
            let mVer = params.match(/(n|s)/i),
                mHor = params.match(/(e|w)/i);
            if (mVer) ver = mVer[1].toLowerCase();
            if (mHor) hor = mHor[1].toLowerCase();
        } else if (typeof params === "object" && params !== null) {
            for (let key in params) {
                if (params[key]) {
                    for (let k in DirectionRegex) {
                        if ((new RegExp(`^${DirectionRegex[k]}$`, "i")).test(key)) {
                            if (/(n|s)/i.test(k)) ver = k;
                            else if (/(e|w)/i.test(k)) hor = k;
                            delete params[key];
                        }
                    }
                }
            }
        }

        if (ver === "" && hor === "") {
            throw "Invalid direction";
        }
        this.direction = ver.charAt(0) + hor.charAt(0);
        if (typeof params === "object") {
            this.assignClass(this, params);
        }
    }

    toLocale(lang) {
        return utils.GetLocale(this.direction, lang, this.constructor.name.toLowerCase())
    }
}

module.exports = Direction;