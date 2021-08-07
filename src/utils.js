const Phone = require("awesome-phonenumber");
const Axios = require("axios");
const _LANG = require("./locale");

function ToLocale(data, lang, package, html) {
    lang = lang || "en";
    const LANG = _LANG.GetPackage(package, lang);

    if (Array.isArray(data)) {
        return data.map(v => ToLocale(v, lang, package)).filter(v => !(v === "" || v === null || (Array.isArray(v) && v.length == 0) || (typeof v === "object" && Object.keys(v).length == 0)))
    } else if (typeof data === "object" && data !== null) {
        if (data.constructor && data.toLocale) {
            let name = data.constructor.name.toLowerCase();
            if (name != package) return data.toLocale(lang);
        }

        let result = {};
        if (lang in data) return data[lang];
        for (let key in data) {
            if (typeof data[key] !== "undefined") {
                let val = data[key];
                if (/^(tel|fax)$/.test(key)) {
                    if (typeof val === "string") val = val.split(/[,;，；]/);
                    val = val.filter(v => v.trim() != "")
                        .map(v => {
                            let digits = v.match(/\d/g);
                            if (digits.length > 8 && digits.join("").substr(0, 3) == 852) v = digits.join("").substr(3);
                            let phone = new Phone(v, "HK");
                            if (phone.isValid()) {
                                return phone.getNumber("international");
                            }
                            return v
                        })
                } else if (Array.isArray(val)) {
                    val = ToLocale(val, lang, package, key == "available")
                } else if (typeof val === "object" && val !== null) {
                    if (val.constructor && val.toLocale) val = val.toLocale(lang);
                    else if (lang in val) {
                        val = val[lang];
                    } else {
                        let validTemp = {},
                            available = [];
                        Object.keys(val).filter(v => !(/^_/.test(v) || val[v] === "" || typeof val[v] === "undefined")).map(v => validTemp[v] = val[v])
                        available = _LANG.GetAvailableLang(validTemp);
                        if (lang in validTemp) val = validTemp[lang];
                        else if (available.length > 0) val = validTemp[available[0]];
                        else val = ToLocale(validTemp, lang, package);
                    }
                } else if (typeof val === "boolean") {
                    val = LANG[val.toString()];
                } else if (typeof val === "string") { // Must be the last condition
                    if (val in LANG) {
                        val = LANG[val];
                    }
                }

                if (typeof val === "string") {
                    val = val.replace(/[\r\n]+/g, "<br>").replace(/(<br[\/\s]*>)+/g, html ? "<br>" : " ");
                }

                let excludeKey = !/[A-z]/i.test(key) || (/[A-z]/.test(key) && key != key.toUpperCase())
                if (!(val === "" || val === null || (Array.isArray(val) && val.length == 0) || (typeof val === "object" && Object.keys(val).length == 0))) {
                    if (excludeKey && key in LANG) result[LANG[key]] = val
                    else if (!/^_/.test(key)) result[key] = val
                }
            }
        }
        return result
    } else if (typeof data === "string" && data in LANG) {
        return LANG[data];
    }
    return data
}

function GetLocale(key, lang, package) {
    const LANG = _LANG.Get(package, lang);
    if (key in LANG) return LANG[key];
    return key
}

function ToGeoJson(data, lang, package) {
    let result = {
        type: "FeatureCollection",
        features: []
    }
    if (!Array.isArray(data)) data = [data];
    data.map((item, i) => {
        let feature = {
                type: "Feature",
                properties: {}
            },
            sort = ["tel", "fax", "website", "opening"],
            useful = {};
        for (let key in item) {
            if (key == "coordinate") {
                feature.geometry = {
                    type: "Point",
                    coordinates: [item[key].longitude, item[key].latitude]
                };
            } else if (/^(name|address)$/.test(key) || (!("name" in item) && key == "facilityName")) {
                feature.properties[key == "facilityName" ? "name" : key] = ToLocale(item[key], lang, package, true);
            } else if (sort.indexOf(key) != -1) {
                useful[key] = item[key];
                // if (key == "opening" && "openingDetail" in item[key]) {
                //     useful.openingDetail = item[key].openingDetail;
                // }
            }
        }
        feature.properties.detail = {}
        Object.keys(useful)
            .sort((a, b) => sort.indexOf(a) - sort.indexOf(b))
            .map(v => {
                feature.properties.detail[v] = geoJsonDetail(v, useful[v], lang, package)
            });
        result.features.push(feature)
    })
    return result;
}

function geoJsonDetail(key, data, lang, package) {
    let obj = {},
        type = "text";
    obj[key] = data;
    let locale = ToLocale(obj, lang, package, true),
        langKey = Object.keys(locale)[0];
    if (key == "opening" && typeof locale[langKey] === "object" && Object.keys(locale[langKey]).length > 1) {
        let temp = {
            name: langKey,
            value: {},
            type: "opening"
        }
        Object.keys(data)
            .filter(v => /^(mon|tue|wed|thu|fri|sat|sun|ph)$/.test(v))
            .map(v => temp.value[v] = geoJsonDetail(v, data[v], lang, package))
        return temp;
    }
    if (/website/.test(key)) {
        type = "url"
    } else if (/^(fax|tel)$/.test(key)) {
        type = key;
    }
    return {
        name: langKey,
        value: locale[langKey],
        type: type
    }
}

function CreateAxiosInstance(opts, debug) {
    global.axiosInstance = Axios.create(opts || {});
    if (debug) {
        try {
            require("axios-curlirize")(global.axiosInstance)
        } catch (e) {}
    }
    return global.axiosInstance;
}

module.exports = {
    ToLocale,
    CreateAxiosInstance,
    GetLocale,
    GetAvailableLang: _LANG.GetAvailableLang,
    ToGeoJson,
}