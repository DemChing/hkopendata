const BaseComponent = require("./BaseComponent");
const UNITS = require("../../data/units.json");
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
        if (this.type in UNITS.types || "default" in UNITS.types) {
            if (!(this.type in UNITS.types)) this.type = "default";
            if (this.category in UNITS.types[this.type]) {
                this._unitInfo = UNITS.types[this.type][this.category];
            }
        }
        this.si = !!this._unitInfo.si;
        if (this.scale != "default" && this.si) {
            this._scaleInfo = UNITS.scales.si[this.scale];
        }
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
            for (let s in UNITS.scales.si) {
                let d = Math.abs(UNITS.scales.si[s].value - power),
                    common = !("uncommon" in UNITS.scales.si[s]) || UNITS.scales.si[s].uncommon.indexOf(`${this.type}-${this.category}`) != -1;
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
            if (scale in UNITS.scales.si) {
                newScale = UNITS.scales.si[scale];
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
        let scale = "_scaleInfo" in unitValue ? unitValue._scaleInfo[text ? lang : "prefix"] : "",
            unit = unitValue._unitInfo[text ? lang : "unit"];
        return unitValue._unitInfo.prefix ? `${unit}${unitValue.value}${scale}` : `${unitValue.value}${scale}${unit}`;
    }
}

module.exports = UnitValue;