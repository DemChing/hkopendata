const BaseComponent = require("./BaseComponent");
const utils = require("../utils");
const UNITS = require("../units");
const DEFAULT_UNIT = {
    "en": "",
    "tc": "",
    "unit": ""
};
const DEFAULT_SCALE = {
    "en": "",
    "tc": "",
    "prefix": "",
    "value": 0
};

class UnitValue extends BaseComponent {
    constructor(params) {
        super();
        this.assignClass(this, params);
        if (typeof this.value === "string" && !isNaN(parseFloat(this.value))) {
            this.value = parseFloat(this.value);
        }
        this.scale = this.scale || "default";
        this._unitInfo = DEFAULT_UNIT;
        this._scaleInfo = DEFAULT_SCALE;
        let unit = UNITS.GetType(this.type) || UNITS.GetType("default");
        if (unit && this.category in unit) this._unitInfo = unit[this.category];
        else this.type = "default";
        this.si = !!this._unitInfo.si;
        if (this.scale != "default" && this.si) {
            let scales = UNITS.GetScale("si");
            if (scales && this.scale in scales) this._scaleInfo = scales[this.scale];
        }
        this.every = this.every || false;
    }
    toBestScaleSI() {
        if (this.si && this.value != 0) {
            this.scaleSI();
            let scale = this.scale,
                power = 0,
                diff = 1e5,
                value = Math.abs(this.value);
            if (value > 10) {
                while (value >= 10) {
                    value /= 10;
                    power++
                }
            } else if (value < 1) {
                while (value < 1) {
                    value *= 10;
                    power--
                }
            }
            let SI = UNITS.GetScale("si") || {};
            for (let s in SI) {
                let d = Math.abs(SI[s].value - power),
                    common = !("uncommon" in SI[s]) || SI[s].uncommon.indexOf(`${this.type}-${this.category}`) != -1;
                if (common && d < diff) {
                    diff = d;
                    scale = s;
                }
            }
            if (Math.abs(0 - power) > diff) this.scaleSI(scale)
        }
    }
    scaleSI(scale) {
        scale = scale || "default"
        if (this.si && this.scale != scale) {
            let value = this._scaleInfo.value,
                newScale = DEFAULT_SCALE;
            let SI = UNITS.GetScale("si") || {};
            if (scale in SI) {
                newScale = SI[scale];
            }
            this.value *= Math.pow(10, value - newScale.value);
            if (this.value % 1 > 0.99999999999999 || this.value % 1 < 0.00000000000001) this.value = Math.round(this.value)
            this.scale = scale;
            this._scaleInfo = newScale;
        }
    }
    toLocale(lang, text) {
        let unitValue = new UnitValue({
            ...this
        });
        unitValue.toBestScaleSI();
        if (unitValue.every) text = true;
        let scale = "_scaleInfo" in unitValue ? unitValue._scaleInfo[text ? lang : "prefix"] : "",
            unit = unitValue._unitInfo[text ? lang : "unit"];
        if (unitValue.every) {
            return `${utils.ToLocale("every", lang)} ${unitValue.value} ${scale}${unit}`
        }
        return unitValue._unitInfo.prefix ? `${unit}${unitValue.value}${scale}` : `${unitValue.value}${scale}${unit}`;
    }
}

module.exports = UnitValue;