const bank = require("../bank");
const Middleware = require("../lib/middleware");

module.exports = {
    bch: {
        init: (id, secret, lang) => {
            return Middleware(bank.bch.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.bch.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.bch.search(target, queryData));
        },
    },
    bea: {
        init: (id, secret, lang) => {
            return Middleware(bank.bea.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.bea.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.bea.search(target, queryData));
        },
    },
    boc: {
        init: (id, secret, lang) => {
            return Middleware(bank.boc.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.boc.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.boc.search(target, queryData));
        },
    },
    cal: {
        init: (id, secret, lang) => {
            return Middleware(bank.cal.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.cal.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.cal.search(target, queryData));
        },
    },
    cbi: {
        init: (id, secret, lang) => {
            return Middleware(bank.cbi.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.cbi.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.cbi.search(target, queryData));
        },
    },
    chb: {
        init: (id, secret, lang) => {
            return Middleware(bank.chb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.chb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.chb.search(target, queryData));
        },
    },
    chiyu: {
        init: (id, secret, lang) => {
            return Middleware(bank.chiyu.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.chiyu.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.chiyu.search(target, queryData));
        },
    },
    ctn: {
        init: (id, secret, lang) => {
            return Middleware(bank.ctn.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.ctn.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.ctn.search(target, queryData));
        },
    },
    dbs: {
        init: (id, secret, app, jwt, lang) => {
            return Middleware(bank.dbs.init(id, secret, app, jwt, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.dbs.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.dbs.search(target, queryData));
        },
    },
    dsb: {
        init: (id, secret, lang) => {
            return Middleware(bank.dsb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.dsb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.dsb.search(target, queryData));
        },
    },
    fbb: {
        init: (id, secret, lang) => {
            return Middleware(bank.fbb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.fbb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.fbb.search(target, queryData));
        },
    },
    hs: {
        init: (id, secret, lang) => {
            return Middleware(bank.hs.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.hs.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.hs.search(target, queryData));
        },
    },
    hsbc: {
        init: (id, secret, lang) => {
            return Middleware(bank.hsbc.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.hsbc.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.hsbc.search(target, queryData));
        },
    },
    icb: {
        init: (id, secret, lang) => {
            return Middleware(bank.icb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.icb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.icb.search(target, queryData));
        },
    },
    ncb: {
        init: (id, secret, lang) => {
            return Middleware(bank.ncb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.ncb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.ncb.search(target, queryData));
        },
    },
    pbl: {
        init: (id, secret, lang) => {
            return Middleware(bank.pbl.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.pbl.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.pbl.search(target, queryData));
        },
    },
    sc: {
        init: (id, secret, lang) => {
            return Middleware(bank.sc.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.sc.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.sc.search(target, queryData));
        },
    },
    scb: {
        init: (id, secret, lang) => {
            return Middleware(bank.scb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.scb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.scb.search(target, queryData));
        },
    },
    whb: {
        init: (id, secret, lang) => {
            return Middleware(bank.whb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.whb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.whb.search(target, queryData));
        },
    },
    wlb: {
        init: (id, secret, lang) => {
            return Middleware(bank.wlb.init(id, secret, lang));
        },
        connect: (credential, lang) => {
            return Middleware(bank.wlb.connect(credential, lang));
        },
        search: (target, queryData) => {
            return Middleware(bank.wlb.search(target, queryData));
        },
    },
    hsbcgp: (code) => {
        let _bank = bank.hsbcgp(code);
        return {
            init: (id, secret, lang) => {
                return Middleware(_bank.init(id, secret, lang));
            },
            connect: (credential, lang) => {
                return Middleware(_bank.connect(credential, lang));
            },
            search: (target, queryData) => {
                return Middleware(_bank.search(target, queryData));
            },
        }
    },
    bochk: (code) => {
        let _bank = bank.bochk(code);
        return {
            init: (id, secret, lang) => {
                return Middleware(_bank.init(id, secret, lang));
            },
            connect: (credential, lang) => {
                return Middleware(_bank.connect(credential, lang));
            },
            search: (target, queryData) => {
                return Middleware(_bank.search(target, queryData));
            },
        }
    },
    jetco: (code) => {
        let _bank = bank.jetco(code);
        return {
            init: (id, secret, lang) => {
                return Middleware(_bank.init(id, secret, lang));
            },
            connect: (credential, lang) => {
                return Middleware(_bank.connect(credential, lang));
            },
            search: (target, queryData) => {
                return Middleware(_bank.search(target, queryData));
            },
        }
    },
};