String.prototype.toCamelCase = function () {
    let str = this.valueOf(),
        arr = str.split(/(?=[A-Z])/);
    if (!/[A-z]/.test(str)) return str;
    if (arr.length == str.length) return str.toLowerCase();
    return arr.join("_").toLowerCase().match(/([a-z0-9]+)/g).reduce((p, c, i) => p += i == 0 ? c : (c[0].toUpperCase() + c.slice(1)), "")
}

String.prototype.toPascalCase = function () {
    let str = this.valueOf().toCamelCase();
    return str[0].toUpperCase() + str.slice(1);
}

String.prototype.decodeEntities = function () {
    let str = this.valueOf();
    let replace = {
        "&nbsp;": " ",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot": "\"",
    }
    for (let key in replace) {
        str = str.replace(new RegExp(key, "gi"), replace[key])
    }
    let m;
    while (m = str.match(/&#(\d+);/)) {
        str = str.replace(new RegExp(m[0], "g"), String.fromCharCode(m[1]))
    }
    while (m = str.match(/&#(x[a-f0-9]+);/i)) {
        str = str.replace(new RegExp(m[0], "gi"), String.fromCharCode("0" + m[1]))
    }
    return str;
}

String.prototype.breakline = function (chars) {
    let str = this.valueOf();
    chars = chars || /\n|\r?\\n|<br[ /]*>|•/;
    let arr = str.split(chars).map(v => v.decodeEntities().trimChar(" -")).filter(v => v != "");
    return arr.length == 1 ? arr[0] : arr;
}

String.prototype.trimLeftChar = function (chars) {
    return this.valueOf().replace(new RegExp(`^[${chars}]+`, "g"), "");
}

String.prototype.trimRightChar = function (chars) {
    return this.valueOf().replace(new RegExp(`[${chars}]+$`, "g"), "");
}

String.prototype.trimChar = function (chars) {
    return this.valueOf().trimLeftChar(chars).trimRightChar(chars);
}

String.prototype.parseNumber = function (dec) {
    let val = this.valueOf();
    let num = parseFloat(val),
        str = num.toString(),
        str2 = typeof dec === "number" ? num.toFixed(dec) : str;
    return str == val || str2 == val ? num : val;
}

Number.prototype.parseNumber = function () {
    return this.valueOf();
}