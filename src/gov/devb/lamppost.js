// https://mplpssl.wisx.io/docs/Data_Specification_for_mplp-sensor-data_PSI_TC.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const {
    Lamppost,
    UnitValue
} = require("../../_class");
const BASE_URL = "https://mplpssl.wisx.io/nodered/getlampposts/";

function search(opts) {
    return new Promise((resolve, reject) => {
        cmn.APIRequest(BASE_URL)
            .then((res) => {
                resolve(processData(res, opts));
            })
            .catch((err) => reject(err))
    })
}

function processData(data, opts) {
    let result = [];
    data.map((item) => {
        let temp = {
            _type: "devb",
            name: {},
            report: {},
            coordinateHK: {
                _type: "tmerc",
                _system: "hk1980"
            }
        };
        for (let key in item) {
            let m;
            if (key == "name") {
                temp._id = item[key];
            } else if (key == "last_sensor_value") {
                item[key].map((v) => {
                    let t, c, s, m,
                        reportItem = {
                            type: v.id,
                        },
                        reportKey = "others";
                    if (/^(wind|temperature|humidity|radiation|pressure)/.test(v.id)) {
                        reportKey = v.id;
                        if (m = v.id.match(/(temperature|humidity)_(\d+)?/)) {
                            reportKey = m[1];
                            if (m[1] == "temperature") {
                                t = "temperature";
                                c = "celsius";
                            } else {
                                t = "ratio";
                                c = "percent";
                            }
                        } else if (m = v.id.match(/wind([A-z]+)?/)) {
                            reportKey = "wind";
                            if (m[1] == "speed") {
                                t = "speed";
                                c = "ms";
                            } else {
                                t = "angle";
                                c = "degree";
                            }
                        } else if (v.id == "radiation") {
                            t = "flux";
                            c = "wm";
                        } else if (v.id == "pressure") {
                            t = "pressure";
                            c = "pascal";
                            s = "hecto"
                        }
                    } else if (m = v.id.match(/(people|vehicle)/)) {
                        reportKey = m[1];
                    } else if (m = v.id.match(/^pm(\d+)/)) {
                        reportKey = "particulate"
                        t = "density";
                        c = "pm";
                    } else if (/^(no\d*|o3|co)$/.test(v.id)) {
                        reportKey = "pollutant";
                        if (m = v.id.match(/no(\d)?/)) {
                            reportItem.type = "no" + (m[1] ? m[1] : 1),
                            t = "ratio";
                            c = "ppb";
                        } else if (/o3|co/.test(v.id)) {
                            t = "ratio";
                            c = v.id == "co" ? "ppm" : "ppb";
                        }
                    }
                    if (v.value != "-") {
                        if (t && c) {
                            reportItem.value = new UnitValue({
                                type: t,
                                category: c,
                                scale: s,
                                value: parseFloat(v.value)
                            })
                        } else {
                            reportItem.value = parseFloat(v.value)
                        }
                    }
                    if (!(reportKey in temp.report)) temp.report[reportKey] = [];
                    temp.report[reportKey].push(reportItem)
                });
            } else if (key == "update_date") {
                temp.lastUpdate = moment().format("YYYY-MM-DD HH:mm:ss")
            } else if (m = key.match(/^fullname_(en|tc|sc)$/)) {
                temp.name[m[1]] = item[key];
            } else if (m = key.match(/^hk1980_(northing|easting)$/)) {
                temp.coordinateHK[m[1]] = item[key];
            }
        }
        result.push(new Lamppost(temp))
    })
    return result
}

module.exports = search