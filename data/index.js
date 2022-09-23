const Path = require('path');
const localDataPath = Path.join(process.cwd(), '.hkopendata/data');
const localDataPathFallback = [
    Path.join(process.cwd(), 'data'),
    __dirname
];
let list = {
    stations: "hko-station",
    regions: "hk-location",
    legco: "hk-location",
    districts: "hk-location",
    aqhi: "epd-station",
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
        const fs = require("fs");
        for (const dir of [localDataPath, ...localDataPathFallback]) {
            let filename = Path.join(dir, `${file}.json`);
            if (fs.existsSync(filename)) {
                json = require(filename);
                break;
            }
        }
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

function Set(name, data) {
    const fs = require("fs");
    try {
        let dest = Path.join(localDataPath, `${name}.json`),
            dir = Path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, {
            recursive: true
        });
        fs.writeFileSync(dest, JSON.stringify(data));
    } catch (e) {}
}

module.exports = {
    Get,
    Set,
    list
};