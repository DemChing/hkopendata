const org = require("../org");
const Middleware = require("../lib/middleware");

module.exports = {
    bus: {
        searchCTB: (data, opts) => {
            return Middleware(org.bus.searchCTB(data, opts));
        },
        searchMTR: (data, opts) => {
            return Middleware(org.bus.searchMTR(data, opts));
        },
        searchNLB: (data, opts) => {
            return Middleware(org.bus.searchNLB(data, opts));
        },
        searchNWFB: (data, opts) => {
            return Middleware(org.bus.searchNWFB(data, opts));
        },
    },
    ferry: {
        searchCB: (data, opts) => {
            return Middleware(org.ferry.searchCB(data, opts));
        },
        searchLF: (data, opts) => {
            return Middleware(org.ferry.searchLF(data, opts));
        },
        searchSF: (data, opts) => {
            return Middleware(org.ferry.searchSF(data, opts));
        },
    },
    post: {
        searchBox: (data, opts) => {
            return Middleware(org.post.searchBox(data, opts));
        },
        searchMobileOffice: (data, opts) => {
            return Middleware(org.post.searchMobileOffice(data, opts));
        },
        searchOffice: (data, opts) => {
            return Middleware(org.post.searchOffice(data, opts));
        },
        searchPOBox: (data, opts) => {
            return Middleware(org.post.searchPOBox(data, opts));
        },
        searchRate: (data, opts) => {
            return Middleware(org.post.searchRate(data, opts));
        },
        searchStation: (data, opts) => {
            return Middleware(org.post.searchStation(data, opts));
        },
    },
    rail: {
        searchIC: (data, opts) => {
            return Middleware(org.rail.searchIC(data, opts));
        },
        searchLRT: (data, opts) => {
            return Middleware(org.rail.searchLRT(data, opts));
        },
        searchMTR: (data, opts) => {
            return Middleware(org.rail.searchMTR(data, opts));
        },
        searchTram: (data, opts) => {
            return Middleware(org.rail.searchTram(data, opts));
        },
    },
};