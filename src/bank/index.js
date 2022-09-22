let banks = {
        sc: require("./sc")(),
        dbs: require("./dbs")(),
        hsbcgp: require("./hsbcgp"),
        jetco: require("./jetco"),
        bochk: require("./bochk"),
        livi: require("./livi")(),
        ant: require("./ant")(),
        fusion: require("./fusion")(),
        paob: require("./paob")(),
        welab: require("./welab")(),
        za: require("./za")(),
    },
    hsbcgp = ["hsbc", "hs"],
    jetco = ["bch", "bea", "cal", "cbi", "chb", "ctn", "dsb", "fbb", "icb", "pbl", "scb", "whb", "wlb", "vab"],
    bochk = ["boc", "chiyu", "ncb"];

hsbcgp.map(v => banks[v] = require("./hsbcgp")(v))
jetco.map(v => banks[v] = require("./jetco")(v))
bochk.map(v => banks[v] = require("./bochk")(v))

module.exports = banks;