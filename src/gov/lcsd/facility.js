// https://www.lcsd.gov.hk/datagovhk/facility/facility-{type}_data_dictionary.pdf
// https://www.lcsd.gov.hk/datagovhk/venue/venue_data_dictionary.pdf

const cmn = require("../../common");
const {
    Coordinate,
} = require("../../_class");
const LOCALE = require("../../locale").GetRaw('week');
const BASE_URL = "https://www.lcsd.gov.hk/datagovhk/facility/facility-{type}.json";
const VENUE_URL = "https://www.lcsd.gov.hk/datagovhk/venue/venue.json";

const VALID = {
    type: /^(bbqs|beaches|scf|cgf|fw|fitrm|fiteqmt|mcpa|ipfp|ofe|(cp|rs)r|(b|dgp|s|sb)g|hssp(5|7)|(bb|mb|s|(hga|cg(a|n)|(sp(7|11)|rp)(a|n))t)p|(bbq|w)s|ctg|ar|(jtf|rs|o(a|tt))t|(pefa|r?h|w?s|t|tp|(bk|bv|h|n|v|g)b)c|venue)$/
};
const PARAMS = {
    type: "rst"
}
const FIELDS = {
    regex: {
        "^SEARCH01_(EN|TC|SC)$$f-i": "District_$1",
        "^SEARCH02_(EN|TC|SC)$$f-i": "Type_$1",
        "^NSEARCH01_(EN|TC|SC)$$f-i": "Opening_hours_$1",
        "^NSEARCH02_(EN|TC|SC)$$f-i": "Tel_$1",
        "^NSEARCH03_(EN|TC|SC)$$f-i": "Fax_$1",
        "^NSEARCH04_(EN|TC|SC)$$f-i": "Email_$1",
        "^NSEARCH05_(EN|TC|SC)$$f-i": "Website_$1",
        "^NSEARCH06_(EN|TC|SC)$$f-i": "FacilityDetail_$1",
    },
    text: {
        "Phone": "tel",
        "Enquiry_no": "tel",
        "title": "name",
        "area": "size",
        "intro": "description",
        "conditionOfUse": "termsAndConditions",
        "hireCharge": "charges"
    },
    latitude: ["Latitude"],
    longitude: ["Longitude"],
    easting: ["Easting"],
    northing: ["Northing"],
    others: {
        "facilities": "facility",
        "category": "type",
        "ancillaryFacilities": "facilityDetail",
        "dLSOParkApplication": "dlsoApplication",
        "dLSOParkAddress": "dlsoAddress",
        "designatedLocation": "ceremonyLocation",
        "url": "website"
    }
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["venue", "rst", "fw", "fitrm", "fiteqmt", "cpr", "pefac", "ws", "bbqs", "dgpg", "jtft", "oat", "scf", "hssp5", "hssp7", "sp7atp", "sp11atp", "sp7ntp", "sp11ntp", "cgatp", "cgntp", "cgf", "vbc", "bvbc", "rpatp", "rpntp", "hgatp", "bbp", "ottt", "hbc", "nbc", "ctg", "ar", "sbg", "rsr", "rhc", "sp", "bkbc", "tc", "tpc", "bmtc", "bg", "sg", "gbc", "sc", "mbp", "mcpa", "ipfp", "hc", "ofe", "wsc", "beaches",]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);
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
            type, url;
        if (processed.error) {
            reject(processed);
        } else {
            type = processed.data.type;
            url = type == "venue" ? VENUE_URL : BASE_URL.replace("{type}", type);
            cmn.APIRequest(url)
                .then((res) => {
                    if (type == "fiteqmt") {
                        resolve(sumData(res));
                    } else {
                        resolve(processData(res));
                    }
                })
                .catch((err) => reject(err))
        }
    })
}

function convertGeoJson(data) {
    if ("type" in data && data.type === "FeatureCollection" && "features" in data) {
        data = data.features
            .filter(({ type }) => type === "Feature")
            .map(({ properties }) => {
                let temp = {};
                for (let key in properties) {
                    temp[key.toCapitalCase()] = properties[key];
                }
                return temp;
            });
    }
    return data;
}

function processData(data) {
    let result = [];
    convertGeoJson(data).map((item) => {
        let temp = cmn.RenameFields(item, FIELDS),
            facility = {},
            langKey = [];
        if ("Opening_hours_start" in temp && "Opening_hours_end" in temp) {
            temp.opening = `${temp.Opening_hours_start}-${temp.Opening_hours_end}`
            delete temp.Opening_hours_start;
            delete temp.Opening_hours_end;
        }
        for (let key in temp) {
            let m;
            if ((typeof temp[key] === "string" && temp[key].trim() === "") || temp[key] == "") delete temp[key];
            else if (/^(GIHS|tel|opening|fax|email)$/i.test(key)) {
                facility[key.toCamelCase()] = temp[key];
            } else if (m = key.match(/Opening_hours_(en|cn|b5|tc|sc)$/)) {
                let lang = m[1] == "b5" || m[1] == "cn" ? "tc" : m[1],
                    val = temp[key];
                if (!("opening" in facility)) facility.opening = {};
                val = val.replace(/(<br[\/\s]*>|\r|\n)+/g, " ")
                facility.opening[lang] = val

                facility.opening.openingDetail = cmn.StrToWeekTime(val)
            } else if (m = key.match(/([A-z_]+)_no(_[A-z_]+)?$/i)) {
                facility[m[1].toCamelCase() + "s"] = parseInt(temp[key]);
            } else if (m = key.match(/([A-z_]+)_(en|cn|b5|tc|sc)/)) {
                if (temp[key] != "") {
                    let name = m[1].toCamelCase(),
                        lang;
                    if (m[2] == "b5" || m[2] == "cn") lang = "tc";
                    else lang = m[2];
                    if (!(name in facility)) facility[name] = {}
                    facility[name][lang] = temp[key];
                    if (!langKey.includes(name)) langKey.push(name);
                }
            } else if (/^Types$/.test(key) && /^(I|O)$/.test(temp[key])) {
                facility.indoorFacility = temp[key] == "I";
            } else if (!/photo|capacity|fax/i.test(key)) {
                facility[key.toCamelCase()] = temp[key];
            }
        }
        if ("openingHour" in facility) {
            facility.opening = {}
            for (let lang in facility.openingHour) {
                facility.opening[lang] = facility.openingHour[lang].replace(/；\s+/g, "; ").trimChar(" ;");
            }
            delete facility.openingHour;
        }
        if ("publicHolidayOpeningHour" in facility) {
            for (let lang in facility.publicHolidayOpeningHour) {
                if (!("opening" in facility)) facility.opening = {};
                if (!(lang in facility.opening)) facility.opening[lang] = "";
                facility.opening[lang] = `${facility.opening[lang]}; ${LOCALE.ph[lang]}: ${facility.publicHolidayOpeningHour[lang].replace(/；\s+/g, "; ")}`.trimChar(" ;");
            }
            delete facility.publicHolidayOpeningHour;
        }
        if ("coordinate" in facility) facility.coordinate = new Coordinate(facility.coordinate);
        if ("coordinateHK" in facility) facility.coordinateHK = new Coordinate(facility.coordinateHK);

        for (const key of langKey) {
            if (!(key in facility) || typeof facility[key] !== "object") continue;
            let same = true,
                prev;
            for (let lang in facility[key]) {
                let val = facility[key][lang];
                if (typeof val === "object") val = JSON.stringify(val);
                if (typeof prev === "undefined") prev = val;
                else if (prev !== val) {
                    same = false;
                    break;
                }
            }

            if (same) facility[key] = Object.values(facility[key])[0];
        }

        result.push(cmn.RenameFields(facility, FIELDS));
    })
    return result;
}

function sumData(data) {
    let result = [],
        names = [],
        allItems = [];
    data.map((item) => {
        let facility = {}
        for (let key in item) {
            let m;
            if (key == "Name_en" && names.indexOf(item[key]) == -1) {
                names.push(item[key]);
            }
            if (m = key.match(/([A-z_]+)_(en|cn|b5|tc|sc)/)) {
                let name = m[1].toCamelCase(),
                    lang;
                if (m[2] == "b5" || m[2] == "cn") lang = "tc";
                else lang = m[2];
                if (!(name in facility)) facility[name] = {}
                facility[name][lang] = item[key];
            } else if (key.indexOf("No_of_set") != -1) {
                facility.sets = parseInt(item[key]);
            } else if (n = key.match(/([A-z_]+)_no(_[A-z_]+)?$/i)) {
                facility[n[1].toCamelCase() + "s"] = parseInt(item[key]);
            } else if (key == "Shared_with_persons_with_disabilities") {
                facility.disability = item[key] == "Y"
            }
        }
        allItems.push(facility)
    })
    names.map((name) => {
        let facility = {
                equipment: []
            },
            selfItems = allItems.filter(v => v.name.en == name);
        if (!("name" in facility)) facility.name = selfItems[0].name;
        selfItems.map((item) => {
            let temp = {};
            for (let key in item) {
                if (key != "name") temp[key == "equipment" ? "type" : key] = item[key]
            }
            facility.equipment.push(temp)
        })
        result.push(facility)
    })
    return result;
}

module.exports = search