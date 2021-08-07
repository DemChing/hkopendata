let _LANG = {};

function GetAvailableLang(item) {
    return Object.keys(item).filter(v => /^(en|tc|sc)$/i.test(v));
}

function Get(name, lang) {
    name = name || "common";
    lang = lang || "en";
    let locale = {};
    try {
        name = name.replace(/\.\.\/|\.\//g, "");
        let LANG = _LANG[name];
        if (!LANG) {
            LANG = require(`./${name}.json`);
            _LANG[name] = LANG;
        }
        for (let key in LANG) {
            let tLang = lang;
            if (typeof LANG[key] !== "string" && !(lang in LANG[key])) {
                tLang = GetAvailableLang(LANG[key])[0];
            }
            if (typeof LANG[key] === "string") locale[key] = LANG[key]
            else if (Array.isArray(LANG[key][tLang])) locale[key] = LANG[key][tLang][0]
            else locale[key] = LANG[key][tLang]
        }
    } catch (e) {}

    return locale;
}

function GetPackage(name, lang) {
    name = name || "common";
    if (/^(bus|rail|ferry)$/.test(name)) name = "transport";
    if (/^airline$/.test(name)) name = "airport";
    let arr = ["common", "week", "weather", "coordinate", name];
    if (name == "ogcio") arr.push("geo");
    return GetMulti(arr.filter((v, i, l) => l.indexOf(v) == i), lang);
}

function GetMulti(arr, lang) {
    arr = arr || [];
    let locale = {},
        list = arr.map(v => Get(v, lang));
    list.map(pack => {
        for (let key in pack) {
            locale[key] = pack[key];
        }
    })
    return locale;
}

module.exports = {
    Get,
    GetPackage,
    GetMulti,
    GetAvailableLang,
}