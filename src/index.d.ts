type AvailableLanguage = "en" | "tc" | "sc";
type AvailablePackage = "aahk" | "hko" | "ogcio" | "devb" | "lcsd" | "hse" | "effo" | "geo" | "dh" | "ha" | "hkma" | "dc" | "hkpf";
type BochkGroup = "boc" | "chiyu" | "ncb";
type HsbcGroup = "hsbc" | "hs";
type JetcoGroup = "bch" | "bea" | "cal" | "cbi" | "chb" | "ctn" | "dsb" | "fbb" | "icb" | "pbl" | "scb" | "whb" | "wlb";
type AvailableBank = BochkGroup | HsbcGroup | JetcoGroup | "sc" | "dbs";

type GeneralResponse = {
    [name: string]: any
};
type SuccessResponse = {
    error: true;
    data: any;
}
type FailResponse = {
    error: false;
    message: any;
}

type BankCredential = {
    id: string;
    secret: string;
    app?: string;
    jwt?: string;
};

type EnglishOrChinese = "en" | "tc";

type NumberOrNumericString = number | string;
type DateLike = string | Date | moment.Moment;
type CoordinateLike = [NumberOrNumericString, NumberOrNumericString] | {
    longitude: NumberOrNumericString,
    latitude: NumberOrNumericString
};
type CoordinateHKLike = [NumberOrNumericString, NumberOrNumericString] | {
    easting: NumberOrNumericString,
    northing: NumberOrNumericString
};
type BoundaryLike = [CoordinateLike, CoordinateLike];
type BoundaryHKLike = [CoordinateHKLike, CoordinateHKLike];

type AahkSearchFlight = {
    date?: DateLike,
    arrival?: boolean,
    cargo?: boolean,
    lang?: AvailableLanguage
};

type DcSearch = {
    year?: NumberOrNumericString;
    lang?: AvailableLanguage;
};

type SearchCarpark = {
    id?: string | string[];
    vehicle?: NumberOrNumericString;
    boundary?: BoundaryLike;
    lang?: AvailableLanguage;
};

type DevbSearchCarpark = SearchCarpark & {
    full?: boolean,
    carpark?: NumberOrNumericString;
    lang?: EnglishOrChinese;
};

type DhSearchWars = {
    type?: NumberOrNumericString;
    lang?: EnglishOrChinese;
};

type EffoSearchHoliday = {
    year?: NumberOrNumericString;
    lang?: AvailableLanguage;
};

type GeodataSearch = {
    id: string;
    boundary?: BoundaryLike;
    boundaryHK?: BoundaryHKLike;
    lang?: EnglishOrChinese;
};

type HaSearchWaitingTime = {
    lang?: AvailableLanguage;
};

type HkmaSearch = {
    lang?: EnglishOrChinese;
    pagesize?: NumberOrNumericString;
    offset?: NumberOrNumericString;
    fields?: string;
    column?: string;
    filter?: string;
    choose?: string;
    from?: NumberOrNumericString;
    to?: NumberOrNumericString;
    sortby?: string;
    sortorder?: "asc" | "desc";
};

type HkmaSearchSecStaff = HkmaSearch & {
    type: NumberOrNumericString;
    former: boolean;
    chineseName?: string;
    surname?: string;
    forename?: string;
    code?: string;
};

type HkmaSearchSvf = HkmaSearch & {
    segment?: NumberOrNumericString;
};

type HkoSearch = {
    type: NumberOrNumericString;
    lang?: AvailableLanguage;
};

type HkoSearchAstronomy = HkoSearch & {
    year?: NumberOrNumericString;
    month?: NumberOrNumericString;
    day?: NumberOrNumericString;
    hour?: NumberOrNumericString;
    station?: string;
};

type HkoSearchClimate = HkoSearch & {
    station: string;
    year?: NumberOrNumericString;
    month?: NumberOrNumericString;
};

type HkpfSearchMissing = {
    lang?: AvailableLanguage;
};

type HkpfSearchReward = {
    type: NumberOrNumericString;
    lang?: AvailableLanguage;
};

type HseSearch = {
    type: NumberOrNumericString;
    lang?: AvailableLanguage;
};

type LcsdSearchFacility = {
    type: NumberOrNumericString;
};

type LegcoSearch = {
    $top?: NumberOrNumericString;
    $skip?: NumberOrNumericString;
    $orderby?: string;
    $filter?: string;
    $expand?: string;
    $select?: string;
    limit?: NumberOrNumericString;
    offset?: NumberOrNumericString;
    sortby?: string;
    sortorder?: "asc" | "desc";
};

type LegcoSearchBill = LegcoSearch & {
    filter?: {
        id?: string;
        bill?: string;
        ordinance?: string;
        from?: string;
        to?: string;
    }
};

type LegcoSearchCommittee = LegcoSearch & {
    filter?: {
        id?: NumberOrNumericString;
        name?: string;
        code?: string;
        term?: NumberOrNumericString;
    };
    expand?: {
        term?: boolean;
    };
};

type LegcoSearchMeeting = LegcoSearch & {
    filter?: {
        id?: NumberOrNumericString;
        name?: string;
        room?: string;
        type?: string;
        from?: string;
        to?: string;
        term?: NumberOrNumericString;
    };
    expand?: {
        committee?: boolean;
    };
};

type LegcoSearchMember = LegcoSearch & {
    filter?: {
        id?: NumberOrNumericString;
        name?: string;
        surname?: string;
        forename?: string;
        latestTerm?: NumberOrNumericString;
    };
    expand?: {
        memberTerm?: boolean;
    };
};

type LegcoSearchMembership = LegcoSearch & {
    filter?: {
        id?: NumberOrNumericString;
        member?: NumberOrNumericString;
        committee?: NumberOrNumericString;
        term?: NumberOrNumericString;
    };
    expand?: {
        member?: boolean;
        committee?: boolean;
        term?: boolean;
    };
};

type LegcoSearchPolicy = LegcoSearch & {
    filter?: {
        id?: NumberOrNumericString;
        area?: string;
        issue?: string;
        from?: string;
        to?: string;
    };
};

type LegcoSearchVote = LegcoSearch & {
    filter?: {
        motion?: string;
        mover?: string;
        member?: string;
        from?: string;
        to?: string;
        date?: string;
        type?: string;
        vote?: NumberOrNumericString;
    };
    detail?: boolean;
};

type LegcoSearchWebcast = LegcoSearch & {
    filter?: {
        id?: NumberOrNumericString;
        name?: string;
        room?: string;
        from?: string;
        to?: string;
    };
    type?: NumberOrNumericString;
};

type OgcioSearchAddress = {
    query: string;
    limit?: NumberOrNumericString;
};

type OgcioSearchCarpark = SearchCarpark & {
    type: NumberOrNumericString;
};

type OgcioSearchLamppost = {
    type: NumberOrNumericString;
    id?: string;
    boundary?: BoundaryLike;
    boundaryHK?: BoundaryHKLike;
};

type OgcioSearchWifi = {
    type: NumberOrNumericString;
};

type TransportSearch = {
    type: NumberOrNumericString;
    stop?: string;
    route?: string;
    dir?: NumberOrNumericString;
    lang?: AvailableLanguage;
};

type MTRSearchRail = TransportSearch & {
    from?: NumberOrNumericString;
    to?: NumberOrNumericString;
};

type PostSearchRate = {
    type: NumberOrNumericString;
};

type BankInstance = {
    init: (id: string, secret: string, lang?: AvailableLanguage) => Promise<any>;
    connect: (credential: BankCredential, lang?: AvailableLanguage) => Promise<any>;
    search: (target: string, queryData: any) => Promise<GeneralResponse | GeneralResponse[]>;
};
type BankInstanceDbs = {
    init: (id: string, secret: string, app: string, jwt: string, lang?: AvailableLanguage) => Promise<any>;
    connect: (credential: BankCredential, lang?: AvailableLanguage) => Promise<any>;
    search: (target: string, queryData: any) => Promise<GeneralResponse | GeneralResponse[]>;
}

type MBankInstance = {
    init: (id: string, secret: string, lang?: AvailableLanguage) => Promise<SuccessResponse | FailResponse>;
    connect: (credential: BankCredential, lang?: AvailableLanguage) => Promise<SuccessResponse | FailResponse>;
    search: (target: string, queryData: any) => Promise<SuccessResponse | FailResponse>;
};
type MBankInstanceDbs = {
    init: (id: string, secret: string, app: string, jwt: string, lang?: AvailableLanguage) => Promise<SuccessResponse | FailResponse>;
    connect: (credential: BankCredential, lang?: AvailableLanguage) => Promise<SuccessResponse | FailResponse>;
    search: (target: string, queryData: any) => Promise<SuccessResponse | FailResponse>;
};

// utils
export var utils: {
    ToLocale: (data: any, lang?: AvailableLanguage, package?: AvailableLanguage, html?: boolean) => any,
    GetLocale: (key: string, lang?: AvailableLanguage, package?: AvailableLanguage) => string,
}

// gov
export var gov: {
    aahk: {
        searchFlight: (data?: AahkSearchFlight, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    dc: {
        searchAttendance: (data?: DcSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchCalendar: (data?: DcSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchMember: (data?: DcSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    devb: {
        searchCarpark: (data?: DevbSearchCarpark, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchLamppost: () => Promise<GeneralResponse | GeneralResponse[]>;
    };
    dh: {
        searchWars: (data?: DhSearchWars, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    effo: {
        searchHoliday: (data?: EffoSearchHoliday, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        isPublicHoliday: () => Promise<GeneralResponse | GeneralResponse[]>;
        isHoliday: () => Promise<GeneralResponse | GeneralResponse[]>;
        isNonOfficeDay: () => Promise<GeneralResponse | GeneralResponse[]>;
    };
    geo: {
        searchGeo: (data?: GeodataSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    ha: {
        aedWaitingTime: (data?: HaSearchWaitingTime, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        sopWaitingTime: (data?: HaSearchWaitingTime, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    hkma: {
        validate: {
            bankInfo: (data?: HkmaSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
            bankStaff: (data?: HkmaSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
            fraud: (data?: HkmaSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
            lros: (data?: HkmaSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
            secStaff: (data?: HkmaSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
            svf: (data?: HkmaSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        };
    };
    hko: {
        searchAstronomy: (data?: HkoSearchAstronomy, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchClimate: (data?: HkoSearchClimate, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchEarthquake: (data?: HkoSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchWeather: (data?: HkoSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    hkpf: {
        searchMissing: (data?: HkpfSearchMissing, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchReward: (data?: HkpfSearchReward, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    hse: {
        searchHousing: (data?: HseSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchFlat: (data?: HseSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    lcsd: {
        searchFacility: (data?: LcsdSearchFacility, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    legco: {
        searchBill: (data?: LegcoSearchBill, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchCommittee: (data?: LegcoSearchCommittee, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchMeeting: (data?: LegcoSearchMeeting, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchMember: (data?: LegcoSearchMember, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchMembership: (data?: LegcoSearchMembership, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchPolicy: (data?: LegcoSearchPolicy, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchVote: (data?: LegcoSearchVote, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchWebcast: (data?: LegcoSearchWebcast, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    ogcio: {
        searchAddress: (data?: OgcioSearchAddress, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchCarpark: (data?: OgcioSearchCarpark, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchLamppost: (data?: OgcioSearchLamppost, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchPayment: () => Promise<GeneralResponse | GeneralResponse[]>;
        searchWifi: (data?: OgcioSearchWifi, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
}

export var bank: {
    bch: BankInstance;
    bea: BankInstance;
    boc: BankInstance;
    cal: BankInstance;
    cbi: BankInstance;
    chb: BankInstance;
    chiyu: BankInstance;
    ctn: BankInstance;
    dbs: BankInstanceDbs;
    dsb: BankInstance;
    fbb: BankInstance;
    hs: BankInstance;
    hsbc: BankInstance;
    icb: BankInstance;
    ncb: BankInstance;
    pbl: BankInstance;
    sc: BankInstance;
    scb: BankInstance;
    whb: BankInstance;
    wlb: BankInstance;
    bochk: (code: BochkGroup) => BankInstance;
    hsbcgp: (code: HsbcGroup) => BankInstance;
    jetco: (code: JetcoGroup) => BankInstance;
}

// org
export var org: {
    bus: {
        searchCTB: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchMTR: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchNLB: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchNWFB: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    ferry: {
        searchCB: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchLF: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchSF: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
    post: {
        searchBox: () => Promise<GeneralResponse | GeneralResponse[]>;
        searchMobileOffice: () => Promise<GeneralResponse | GeneralResponse[]>;
        searchOffice: () => Promise<GeneralResponse | GeneralResponse[]>;
        searchPOBox: () => Promise<GeneralResponse | GeneralResponse[]>;
        searchRate: (data?: PostSearchRate, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchStation: () => Promise<GeneralResponse | GeneralResponse[]>;
    };
    rail: {
        searchIC: () => Promise<GeneralResponse | GeneralResponse[]>;
        searchLRT: (data?: MTRSearchRail, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchMTR: (data?: MTRSearchRail, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
        searchTram: (data?: TransportSearch, opts?: any) => Promise<GeneralResponse | GeneralResponse[]>;
    };
}

export var middleware: {
    gov: {
        aahk: {
            searchFlight: (data?: AahkSearchFlight, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        dc: {
            searchAttendance: (data?: DcSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchCalendar: (data?: DcSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchMember: (data?: DcSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        devb: {
            searchCarpark: (data?: DevbSearchCarpark, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchLamppost: () => Promise<SuccessResponse | FailResponse>;
        };
        dh: {
            searchWars: (data?: DhSearchWars, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        effo: {
            searchHoliday: (data?: EffoSearchHoliday, opts?: any) => Promise<SuccessResponse | FailResponse>;
            isPublicHoliday: () => Promise<SuccessResponse | FailResponse>;
            isHoliday: () => Promise<SuccessResponse | FailResponse>;
            isNonOfficeDay: () => Promise<SuccessResponse | FailResponse>;
        };
        geo: {
            searchGeo: (data?: GeodataSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        ha: {
            aedWaitingTime: (data?: HaSearchWaitingTime, opts?: any) => Promise<SuccessResponse | FailResponse>;
            sopWaitingTime: (data?: HaSearchWaitingTime, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        hkma: {
            validate: {
                bankInfo: (data?: HkmaSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
                bankStaff: (data?: HkmaSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
                fraud: (data?: HkmaSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
                lros: (data?: HkmaSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
                secStaff: (data?: HkmaSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
                svf: (data?: HkmaSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            };
        };
        hko: {
            searchAstronomy: (data?: HkoSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchClimate: (data?: HkoSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchEarthquake: (data?: HkoSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchWeather: (data?: HkoSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        hkpf: {
            searchMissing: (data?: HkpfSearchMissing, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchReward: (data?: HkpfSearchReward, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        hse: {
            searchHousing: (data?: HseSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchFlat: (data?: HseSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        lcsd: {
            searchFacility: (data?: LcsdSearchFacility, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        legco: {
            searchBill: (data?: LegcoSearchBill, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchCommittee: (data?: LegcoSearchCommittee, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchMeeting: (data?: LegcoSearchMeeting, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchMember: (data?: LegcoSearchMember, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchMembership: (data?: LegcoSearchMembership, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchPolicy: (data?: LegcoSearchPolicy, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchVote: (data?: LegcoSearchVote, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchWebcast: (data?: LegcoSearchWebcast, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        ogcio: {
            searchAddress: (data?: OgcioSearchAddress, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchCarpark: (data?: OgcioSearchCarpark, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchLamppost: (data?: OgcioSearchLamppost, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchPayment: () => Promise<SuccessResponse | FailResponse>;
            searchWifi: (data?: OgcioSearchWifi, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
    };
    bank: {
        bch: MBankInstance;
        bea: MBankInstance;
        boc: MBankInstance;
        cal: MBankInstance;
        cbi: MBankInstance;
        chb: MBankInstance;
        chiyu: MBankInstance;
        ctn: MBankInstance;
        dbs: MBankInstanceDbs;
        dsb: MBankInstance;
        fbb: MBankInstance;
        hs: MBankInstance;
        hsbc: MBankInstance;
        icb: MBankInstance;
        ncb: MBankInstance;
        pbl: MBankInstance;
        sc: MBankInstance;
        scb: MBankInstance;
        whb: MBankInstance;
        wlb: MBankInstance;
        bochk: (code: BochkGroup) => MBankInstance;
        hsbcgp: (code: HsbcGroup) => MBankInstance;
        jetco: (code: JetcoGroup) => MBankInstance;
    };
    org: {
        bus: {
            searchCTB: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchMTR: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchNLB: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchNWFB: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        ferry: {
            searchCB: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchLF: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchSF: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
        post: {
            searchBox: () => Promise<SuccessResponse | FailResponse>;
            searchMobileOffice: () => Promise<SuccessResponse | FailResponse>;
            searchOffice: () => Promise<SuccessResponse | FailResponse>;
            searchPOBox: () => Promise<SuccessResponse | FailResponse>;
            searchRate: (data?: PostSearchRate, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchStation: () => Promise<SuccessResponse | FailResponse>;
        };
        rail: {
            searchIC: () => Promise<SuccessResponse | FailResponse>;
            searchLRT: (data?: MTRSearchRail, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchMTR: (data?: MTRSearchRail, opts?: any) => Promise<SuccessResponse | FailResponse>;
            searchTram: (data?: TransportSearch, opts?: any) => Promise<SuccessResponse | FailResponse>;
        };
    }
}