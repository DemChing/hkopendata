class CoordinateValue {
    constructor(raw) {
        this._raw = raw;
    }
    toDms() {
        let coordinate = parseFloat(this._raw);
        let degree = Math.floor(coordinate);
        let _minute = (coordinate - degree) * 60;
        let minute = Math.floor(_minute);
        let second = (_minute - minute) * 60;
        return {
            degree,
            minute,
            second
        };
    }
    toCoor() {
        let dms = {},
            coor = 0;
        if (typeof this._raw === "string") {
            let dmsStr = this._raw;
            let m;
            if (m = dmsStr.match(/^([0-9]+)[d° ,-]([0-9]+)[' ,-]([0-9.]+)["]?$/i)) {
                if (m[1]) dms.degree = m[1];
                if (m[2]) dms.minute = m[2];
                if (m[3]) dms.second = m[3];
            } else if (m = dmsStr.match(/^([0-9.]+)$/i)) {
                return parseFloat(dmsStr);
            }
        } else if (typeof this._raw === "object") {
            if ("degree" in this._raw) dms.degree = this._raw.degree;
            if ("minute" in this._raw) dms.minute = this._raw.minute;
            if ("second" in this._raw) dms.second = this._raw.second;
        } else if (typeof this._raw === "number") {
            return this._raw;
        }
        if ("degree" in dms) coor += parseInt(dms.degree);
        if ("minute" in dms) coor += parseInt(dms.minute) / 60;
        if ("second" in dms) coor += parseInt(dms.second) / 3600;
        return coor;
    }
}

module.exports = CoordinateValue;