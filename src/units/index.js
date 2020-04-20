let units = {
    types: {},
    scales: {},
};

function Get(type, name) {
    type = type || "types";
    name = name || "length";
    let data = false;
    if (type in units) {
        type = type.replace(/\.\.\/|\.\//g, "");
        name = name.replace(/\.\.\/|\.\//g, "");
        if (name in units[type]) data = units[type][name];
        else {
            try {
                data = require(`./${type}/${name}.json`);
                units[type][name] = data;
            } catch (e) {}
        }
    }
    return data;
}

function GetType(name) {
    return Get("types", name);
}

function GetScale(name) {
    return Get("scales", name);
}

module.exports = {
    Get,
    GetType,
    GetScale,
}