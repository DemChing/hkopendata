const gov = require("../gov");
const Middleware = require("../lib/middleware");

module.exports = {
    aahk: {
        searchFlight: (data, opts) => {
            return Middleware(gov.aahk.searchFlight(data, opts));
        },
    },
    dc: {
        searchAttendance: (data, opts) => {
            return Middleware(gov.dc.searchAttendance(data, opts));
        },
        searchCalendar: (data, opts) => {
            return Middleware(gov.dc.searchCalendar(data, opts));
        },
        searchMember: (data, opts) => {
            return Middleware(gov.dc.searchMember(data, opts));
        },
    },
    devb: {
        searchCarpark: (data, opts) => {
            return Middleware(gov.devb.searchCarpark(data, opts));
        },
        searchLamppost: (opts) => {
            return Middleware(gov.devb.searchLamppost(opts));
        },
    },
    dh: {
        searchWars: (data, opts) => {
            return Middleware(gov.dh.searchWars(data, opts));
        },
    },
    effo: {
        isHoliday: (date) => {
            return Middleware(gov.effo.isHoliday(date));
        },
        isNonOfficeDay: (date) => {
            return Middleware(gov.effo.isNonOfficeDay(date));
        },
        isPublicHoliday: (date) => {
            return Middleware(gov.effo.isPublicHoliday(date));
        },
        searchHoliday: (data, opts) => {
            return Middleware(gov.effo.searchHoliday(data, opts));
        },
    },
    geo: {
        searchGeo: (data, opts) => {
            return Middleware(gov.geo.searchGeo(data, opts));
        },
    },
    ha: {
        aedWaitingTime: (data, opts) => {
            return Middleware(gov.ha.aedWaitingTime(data, opts));
        },
        sopWaitingTime: (data, opts) => {
            return Middleware(gov.ha.sopWaitingTime(data, opts));
        },
    },
    hkma: {
        validate: (data, opts) => {
            return Middleware(gov.hkma.validate(data, opts));
        },
    },
    hko: {
        searchAstronomy: (data, opts) => {
            return Middleware(gov.hko.searchAstronomy(data, opts));
        },
        searchClimate: (data, opts) => {
            return Middleware(gov.hko.searchClimate(data, opts));
        },
        searchEarthquake: (data, opts) => {
            return Middleware(gov.hko.searchEarthquake(data, opts));
        },
        searchWeather: (data, opts) => {
            return Middleware(gov.hko.searchWeather(data, opts));
        },
    },
    hkpf: {
        searchMissing: (data, opts) => {
            return Middleware(gov.hkpf.searchMissing(data, opts));
        },
        searchReward: (data, opts) => {
            return Middleware(gov.hkpf.searchReward(data, opts));
        },
    },
    hse: {
        searchFlat: (data, opts) => {
            return Middleware(gov.hse.searchFlat(data, opts));
        },
        searchHousing: (data, opts) => {
            return Middleware(gov.hse.searchHousing(data, opts));
        },
    },
    lcsd: {
        searchFacility: (data, opts) => {
            return Middleware(gov.lcsd.searchFacility(data, opts));
        },
    },
    legco: {
        searchBill: (data, opts) => {
            return Middleware(gov.legco.searchBill(data, opts));
        },
        searchCommittee: (data, opts) => {
            return Middleware(gov.legco.searchCommittee(data, opts));
        },
        searchMeeting: (data, opts) => {
            return Middleware(gov.legco.searchMeeting(data, opts));
        },
        searchMember: (data, opts) => {
            return Middleware(gov.legco.searchMember(data, opts));
        },
        searchMembership: (data, opts) => {
            return Middleware(gov.legco.searchMembership(data, opts));
        },
        searchPolicy: (data, opts) => {
            return Middleware(gov.legco.searchPolicy(data, opts));
        },
        searchVote: (data, opts) => {
            return Middleware(gov.legco.searchVote(data, opts));
        },
        searchWebcast: (data, opts) => {
            return Middleware(gov.legco.searchWebcast(data, opts));
        },
    },
    ogcio: {
        searchAddress: (data, opts) => {
            return Middleware(gov.ogcio.searchAddress(data, opts));
        },
        searchCarpark: (data, opts) => {
            return Middleware(gov.ogcio.searchCarpark(data, opts));
        },
        searchLamppost: (data, opts) => {
            return Middleware(gov.ogcio.searchLamppost(data, opts));
        },
        searchPayment: () => {
            return Middleware(gov.ogcio.searchPayment());
        },
        searchWifi: (data, opts) => {
            return Middleware(gov.ogcio.searchWifi(data, opts));
        },
    },
};