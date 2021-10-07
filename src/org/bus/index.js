const ctb_nwfb = require("./ctb-nwfb")

function searchCtbOrNwfb(code, params, opts) {
    params = params || {};
    params.company = code;
    return ctb_nwfb(params, opts)
}

function searchCtb(params, opts) {
    return searchCtbOrNwfb("CTB", params, opts);
}

function searchNwfb(params, opts) {
    return searchCtbOrNwfb("NWFB", params, opts);
}

module.exports = {
    searchCTB: searchCtb,
    searchNWFB: searchNwfb,
    searchNLB: require("./nlb"),
    searchMTR: require("./mtr"),
    searchKMB: require("./kmb"),
    searchGMB: require("./gmb"),
}