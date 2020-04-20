let list = {
    stations: "hko-station",
    regions: "hk-location",
    legco: "hk-location",
    districts: "hk-location",
}
let data = {};

function Get(name) {
    name = name.replace(/\.\.\/|\.\//g, "");
    if (name in data) return data[name];
    let file = name,
        arr = [],
        json = {};
    if (name in list) file = list[name];
    try {
        json = require(`./${file}.json`);
    } catch (e) {};
    if (name == "regions") {
        arr = Object.keys(json.region).map(v => json.region[v]);
    } else if (name == "legco") {
        arr = Object.keys(json.legco).map(v => json.legco[v]);
    } else if (name == "districts") {
        arr = json.district.map((district) => {
            return {
                name: {
                    ...district.name
                },
                flat: district.flat,
                location: district.location,
                region: json.region[district.region],
                legco: json.legco[district.legco],
            };
        })
    } else {
        arr = json;
    }
    data[name] = arr;
    return arr;
}

module.exports = {
    Get,
    list
};