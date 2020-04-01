const cmn = require("../../common");
const LOCALE = require("../../locale");
const Coordinate = require("../../_class").Coordinate;
const GEODATA = require("../../../data/geodata.json");
const BASE_URL = "https://geodata.gov.hk/gs/api/v1.0.0/geoDataQuery";

const VALID = {
    id: /^[a-f0-9-]{36}$/,
    lang: /^(ALL|CHI|ENG)$/,
    v: /^[0-9.]+$/,
};
const VALID_OPT = {
    longMin: /^[0-9.]+$/,
    longMax: /^[0-9.]+$/,
    latMin: /^[0-9.]+$/,
    latMax: /^[0-9.]+$/,
    hk80MinX: /^[0-9.]+$/,
    hk80MaxX: /^[0-9.]+$/,
    hk80MinY: /^[0-9.]+$/,
    hk80MaxY: /^[0-9.]+$/,
}
const LANG = {
    ...LOCALE.common,
    ...LOCALE.geo
};
const PARAMS = {
    lang: "ALL",
    v: "1.0.0",
    id: Object.keys(GEODATA[4].set)[16] // 0: 0-49, 1: 0-19, 2: 0-17, 3: 0-16, 4: 0-16, 5: 0-16, 6: 0-7, 7: 0-3, 8: 0-3, 9: 0-0
}
const FIELDS = {}

for (let key in LANG) {
    let type = LANG[key].type || "text";
    if (!(type in FIELDS)) FIELDS[type] = {};
    if (typeof LANG[key] === "string") {
        FIELDS[type][LANG[key]] = key;
    } else {
        for (let lang in LANG[key]) {
            let val;
            if (/^(fax|tel|email|schoolID|siteArea|daysBeforeEstCompletionDate)$/.test(key) || /(UnitsNo|Year|Month)$/.test(key)) {
                val = key
            } else {
                val = key + "_" + lang
            }
            if (typeof LANG[key][lang] === "string") {
                FIELDS[type][LANG[key][lang]] = val
            } else if (Array.isArray(LANG[key][lang])) {
                LANG[key][lang].map(v => FIELDS[type][v] = val)
            }
        }
    }
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                tc: "CHI",
                en: "ENG",
                all: "ALL"
            }
        },
    },
    boundary: ["boundary", "boundaryHK"]
}

function parseSearchFields(params) {
    let temp = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    if ("boundary" in temp) {
        temp.longMin = temp.boundary[0][0];
        temp.longMax = temp.boundary[1][0];
        temp.latMin = temp.boundary[0][1];
        temp.latMax = temp.boundary[1][1];
        delete temp.boundary;
    }
    if ("boundaryHK" in temp) {
        temp.hk80MinX = temp.boundaryHK[0][0];
        temp.hk80MaxX = temp.boundaryHK[1][0];
        temp.hk80MinY = temp.boundaryHK[0][1];
        temp.hk80MaxY = temp.boundaryHK[1][1];
        delete temp.boundaryHK;
    }
    return temp;
}
function validateParameters(params, opts) {
    params = parseSearchFields(params);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);
    if (!result.error) {
        result.data = {
            ...params
        }
    }
    return result;
}

function search(data, opts) {
    return new Promise((resolve, reject) => {
        let processed = validateParameters({
                ...PARAMS,
                ...data
            }),
            params;
        if (processed.error) {
            reject(processed);
        } else {
            params = {
                q: JSON.stringify(processed.data)
            };
            cmn.APIRequest(BASE_URL, params)
                .then((res) => {
                    resolve(processData(res));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let result = [];
    data.features.map(v => {
        let temp = {},
            prop = v.properties,
            preprocess = [{
                    text: ["偶到服務", "Drop-in Service"],
                    key: ["openingTeleInterp", "openingDropIn"]
                },
                {
                    text: ["訪客中心", "Visitor Centre"],
                    key: ["openingVisitorCentre", "openingManagementOffice"]
                },
                {
                    text: ["東區入境船隻認可碇泊處", "Eastern Immigration Anchorage"],
                    key: ["openingAnchorage1", "openingAnchorage2"]
                },
                {
                    text: ["診症時間", "Consulation Hours"],
                    key: ["hourRegistration", "hourConsulation"]
                },
                {
                    text: ["夜間賽馬日", "非賽馬日", "冬季時段", "Sha Tin Night Race", "Non-racedays", "Winter Time"],
                    key: ["openingSummerDayRace", "openingSummerNightRace", "openingSummerNoRace", "openingWinterDayRace", "openingWinterNightRace", "openingWinterNoRace"]
                },
                {
                    text: ["其他公園範圍", "Other park area"],
                    key: ["openingExhibitionGallery", "openingOtherParkArea"]
                },
                {
                    text: ["十一月至三月", "11月至3月", "11 月至3 月", "November to March"],
                    key: ["openingSummerPool", "openingWinterPool"]
                }
            ],
            tempItem,
            openingTemp = {};
        if (v.geometry.type == "Polygon") {
            temp.coordinates = [];
            v.geometry.coordinates[0].map(u => temp.coordinates.push(new Coordinate({
                longitude: u[0],
                latitude: u[1],
            })))
        } else if (v.geometry.type == "Point") {
            temp.coordinate = new Coordinate({
                longitude: v.geometry.coordinates[0],
                latitude: v.geometry.coordinates[1],
            })
        }

        // Pre-process prop
        if ("District" in prop && !("Sub District" in prop)) {
            prop["Sub District"] = prop["District"];
            delete prop["District"];
        }
        tempItem = cmn.RenameFields(prop, FIELDS);

        // Pre-process time/opening
        for (let key in tempItem) {
            let replace = [
                    "每月第一和第三個星期一上午7時至下午1時",
                    "7 am – 1 pm on the 1st and 3rd Mondays of each month",
                    /<br[\/ ]*>/g
                ],
                n;
            if (n = key.match(/(time|opening|hour)/i)) {
                if (tempItem[key] != "N.A.") {
                    let n2 = key.match(/(.*)_(en|tc)/);
                    if (!(n2[1] in openingTemp)) openingTemp[n2[1]] = {};
                    openingTemp[n2[1]][n2[2]] = tempItem[key];
                }
                replace.map(v => tempItem[key] = tempItem[key].replace(v, " "))
                if (/[^ ]\s/.test(tempItem[key]) && tempItem[key].length - 2 * tempItem[key].match(/\s/g).length < 5) {
                    tempItem[key] = tempItem[key].replace(/\s/g, "")
                }
                preprocess.map(v => {
                    let m, r = new RegExp(v.text.join("|"), "i");
                    if (r.test(tempItem[key])) {
                        m = tempItem[key].split(r);
                        m.map((u, i) => {
                            tempItem[key.replace(n[1], v.key[i])] = u;
                        })
                    }
                })
            }
        }
        for (let key in tempItem) {
            let m;
            if (tempItem[key] != "N.A.") {
                let val = tempItem[key];
                if (!/opening_/.test(key) && /time|opening|hour/i.test(key)) {
                    val = cmn.StrToWeekTime(val)
                } else if (typeof val === "string") {
                    val = val.split(/<br[\/ ]?>/i).filter(v => v.trim() != "").map(v => v.trim());
                    if (val.length == 1) val = val[0];
                }
                if (m = key.match(/(.*)_(en|tc)/)) {
                    let k = m[1],
                        l = m[2];
                    if (!(k in temp)) temp[k] = {};
                    if (!/opening_/.test(key) && /time|opening|hour/i.test(key) && typeof val === "object") {
                        temp[k] = {
                            ...temp[k],
                            ...val,
                        };
                        if (!("_raw" in temp[k])) temp[k]._raw = {}
                        temp[k]._raw[l] = tempItem[key];
                    } else {
                        temp[k][l] = val;
                    }
                } else {
                    temp[key.toCamelCase()] = val;
                }
            }
        }
        for (let key in temp) {
            if (!(/coordinates?/.test(key)) && typeof temp[key] === "object") {
                if ("en" in temp[key] && "tc" in temp[key] && temp[key].en == temp[key].tc) {
                    temp[key] = temp[key].en;
                } else if ("en" in temp[key] && !("tc" in temp[key])) {
                    temp[key] = temp[key].en;
                } else if (!("en" in temp[key]) && "tc" in temp[key]) {
                    temp[key] = temp[key].tc;
                }
            }
            let m = key.match(/(time|opening|hour)/i);
            if (m && !/(time|opening|hour)$/i.test(key)) {
                temp[m[1]][key] = temp[key];
                delete temp[key]
            }
        }
        for (let key in openingTemp) {
            for (let lang in openingTemp[key]) {
                if (!(key in temp)) temp[key] = {};
                temp[key][lang] = openingTemp[key][lang];
            }
        }
        result.push(temp)
    })
    return result
}

module.exports = search