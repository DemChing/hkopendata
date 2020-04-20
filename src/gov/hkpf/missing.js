const cmn = require("../../common");
const BASE_URL = "https://www.police.gov.hk/info/appeals_public/missing_persons/mp.php";

const VALID = {
    lang: /^(en|tc|sc)$/,
};
const PARAMS = {
    lang: "en",
}
const FIELDS = {
    text: {
        "sn": "case",
        "mname": "name",
        "mdate": "missingDate",
        "face": "description",
        "wear": "wearing",
        "url": "website",
        "reporteddate": "reportedDate",
        "other": "detail",
        "other2": "remarks",
        "revisedDate": "lastUpdate",
    }
}

function validateParameters(params) {
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
        });
        if (processed.error) {
            reject(processed);
        } else {
            cmn.XMLFetch(BASE_URL, processed.data)
                .then((res) => {
                    resolve(processData(res, processed.data))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    opts = opts || {};
    const host = "https://www.police.gov.hk";
    let result = [],
        lang = opts.lang || "en";
    data.missingPersons.case.map(item => {
        let temp = {}
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            if (key == "website") {
                temp[key] = `${host}/ppp_${lang}/06_appeals_public/missing/${item[key]}`;
            } else if (/^img/.test(key)) {
                if (!("images" in temp)) temp.images = [];
                let url = `${host}${item[key].replace(/\s/g, "%20")}`;
                if (temp.images.indexOf(url) == -1) temp.images.push(url);
            } else if (!/^(region|emname)$/.test(key)) {
                temp[key] = item[key];
            }
        }
        if ("name2" in temp) {
            let regex = new RegExp(`${temp.name}|${temp.gender}子?`, "gi"),
                nationality = temp.name2.replace(regex, "").trimChar(" /");
            temp.nationality = nationality;
            delete temp.name2;
        }
        result.push(temp)
    })
    return result;
}

module.exports = search;