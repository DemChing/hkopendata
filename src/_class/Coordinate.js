const proj4 = require("proj4");
const BaseComponent = require("./BaseComponent");
const CoordinateValue = require("./CoordinateValue");

const PROJ4 = {
    WGS84: " +ellps=WGS84 +datum=WGS84",
    HK1980: " +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425"
}

proj4.defs([
    ["EPSG:4326", "+title=WGS84 (long/lat) +proj=longlat" + PROJ4.WGS84 + " +no_defs"],
    ["EPSG:4611", "+title=HK80 (long/lat) +proj=longlat" + PROJ4.HK1980 + " +no_defs"],
    ["EPSG:2326", "+title=HK80 Grid +proj=tmerc +lat_0=22.312133333333335 +lon_0=114.17855555555556 +k=1 +x_0=836694.05 +y_0=819069.8" + PROJ4.HK1980 + " +units=m +no_defs"],
    ["EPSG:32649", "+title=WGS84 49N +proj=utm +zone=49" + PROJ4.WGS84 + " +units=m +no_defs"],
    ["EPSG:32650", "+title=WGS84 50N +proj=utm +zone=50" + PROJ4.WGS84 + " +units=m +no_defs"],
    ["HK8049", "+title=HK80 49N +proj=utm +zone=49" + PROJ4.HK1980 + " +units=m +no_defs"],
    ["HK8050", "+title=HK80 50N +proj=utm +zone=50" + PROJ4.HK1980 + " +units=m +no_defs"],
])

class Coordinate extends BaseComponent {
    constructor(params) {
        super();
        this.assignClass(this, params);
        this._raw = {...params};
        this._type = this._type || "latlong";
        this._system = this._system || "wgs84";
        this.validateInput();
        this._standard = this.getStandard();
    }
    validateInput() {
        if (this._type == "latlong") {
            if (this.latitude > 800000 && this.longitude > 800000) {
                this._type = "tmerc";
                this._system = "hk1980";
                this.easting = this.longitude;
                this.northing = this.latitude;
                delete this.longitude;
                delete this.latitude;
            }
        } else if (this._system == "hk1980" && this._type == "tmerc") {
            if (Math.abs(this.easting) <= 180 && Math.abs(this.northing) <= 90) {
                this._type = "latlong";
                this._system = "wgs84";
                this.longitude = this.easting;
                this.latitude = this.northing;
                delete this.easting;
                delete this.northing;
            }
        }
    }
    distance(coor) {
        if (typeof coor !== "object" || coor === null) return false;
        if (Coordinate.prototype.isPrototypeOf(coor)) {
            if (this._standard == coor._standard) return distance(this, coor)
            return distance(this.toLatLong(), coor.toLatLong())
        } else if ("latitude" in coor && "longitude" in coor) {
            return distance(this.toLatLong(), coor)
        } else if ("easting" in coor && "northing" in coor) {
            return distance(this.toHK1980(), coor)
        }
        return false
    }
    toLatLongDms() {
        let coor = this.toLatLong();
        return {
            latitude: new CoordinateValue(coor.latitude).toDms(),
            longitude: new CoordinateValue(coor.longitude).toDms(),
        }
    }
    toLatLong() {
        if (this._system != "wgs84" || this._type != "latlong") {
            let pt, res;

            if (this._type == "latlong") {
                pt = [parseFloat(this.longitude), parseFloat(this.latitude)];
            } else if (this._type == "utm" || this._type == "tmerc") {
                pt = [parseFloat(this.easting), parseFloat(this.northing)];
            }
            res = proj4(this._standard, "EPSG:4326", pt);

            return {
                latitude: res[1],
                longitude: res[0],
            }
        }
        return {
            latitude: this.latitude,
            longitude: this.longitude,
        }
    }
    toHK1980() {
        if (this._system != "hk1980" || this._type != "tmerc") {
            let pt, res;

            if (this._type == "latlong") {
                pt = [parseFloat(this.longitude), parseFloat(this.latitude)];
            } else if (this._type == "utm" || this._type == "tmerc") {
                pt = [parseFloat(this.easting), parseFloat(this.northing)];
            }
            res = proj4(this._standard, "EPSG:2326", pt);

            return {
                northing: res[1],
                easting: res[0],
            }
        }
        return {
            northing: this.northing,
            easting: this.easting,
        }
    }
    getStandard() {
        if (this._system == "hk1980" && this._type == "utm") return "HK8050";
        else if (this._system == "hk1980" && this._type == "latlong") return "EPSG:4611";
        else if (this._system == "hk1980" && this._type == "tmerc") return "EPSG:2326";
        else if (this._system == "wgs" && this._type == "utm") return "EPSG:32650";
        return "EPSG:4326";
    }
}

function distance(coor1, coor2) {
    if ("latitude" in coor1 && "longitude" in coor1 && "latitude" in coor2 && "longitude" in coor2) {
        let latDiff = Math.abs(parseFloat(coor1.latitude) - parseFloat(coor2.latitude));
        let longDiff = Math.abs(parseFloat(coor1.longitude) - parseFloat(coor2.longitude));
        return Math.sqrt(latDiff * latDiff + longDiff * longDiff) * 1.1132e2;
    } else if ("easting" in coor1 && "northing" in coor1 && "easting" in coor2 && "northing" in coor2) {
        let eDiff = Math.abs(parseFloat(coor1.easting) - parseFloat(coor2.easting));
        let nDiff = Math.abs(parseFloat(coor1.northing) - parseFloat(coor2.northing));
        return Math.sqrt(eDiff * eDiff + nDiff * nDiff) / 1000;
    }
}

module.exports = Coordinate;