import moment from "moment";
import axios, { AxiosRequestConfig } from 'axios';

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
type GeneralPromise = Promise<GeneralResponse | GeneralResponse[]>;
type SuccessFailPromise = Promise<SuccessResponse | FailResponse>;

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

type EpdSearchIndex = {
    lang?: AvailableLanguage;
    station?: string;
    type?: NumberOrNumericString;
};

type EpdSearchAqhi = EpdSearchIndex & {
    year?: NumberOrNumericString;
    month?: NumberOrNumericString;
    day?: NumberOrNumericString;
    hour?: NumberOrNumericString;
};

type EpdSearchApi = EpdSearchAqhi & {
    lang?: Exclude<AvailableLanguage, "sc">;
};

type EpdLatestSearchAqhi = EpdSearchIndex;

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

type HkoLatestSearch = {
    lang?: AvailableLanguage;
    station?: string;
};

type HkoLatestSearchLightning = {
    lang?: AvailableLanguage;
};

type HkoLatestSearchVisibility = {
    lang?: AvailableLanguage;
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

type MdLatestSearchTide = {
    lang?: AvailableLanguage;
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
    search: (target: string, queryData: any) => GeneralPromise;
};
type BankInstanceDbs = {
    init: (id: string, secret: string, app: string, jwt: string, lang?: AvailableLanguage) => Promise<any>;
    connect: (credential: BankCredential, lang?: AvailableLanguage) => Promise<any>;
    search: (target: string, queryData: any) => GeneralPromise;
}

type MBankInstance = {
    init: (id: string, secret: string, lang?: AvailableLanguage) => SuccessFailPromise;
    connect: (credential: BankCredential, lang?: AvailableLanguage) => SuccessFailPromise;
    search: (target: string, queryData: any) => SuccessFailPromise;
};
type MBankInstanceDbs = {
    init: (id: string, secret: string, app: string, jwt: string, lang?: AvailableLanguage) => SuccessFailPromise;
    connect: (credential: BankCredential, lang?: AvailableLanguage) => SuccessFailPromise;
    search: (target: string, queryData: any) => SuccessFailPromise;
};

// utils
export var utils: {
    ToLocale: (data: any, lang?: AvailableLanguage, pack?: AvailableLanguage, html?: boolean) => any,
    GetLocale: (key: string, lang?: AvailableLanguage, pack?: AvailableLanguage) => string,
    CreateAxiosInstance: (opts?: AxiosRequestConfig) => typeof axios,
}

// gov
export var gov: {
    aahk: {
        searchFlight: (data?: AahkSearchFlight, opts?: any) => GeneralPromise;
    };
    dc: {
        searchAttendance: (data?: DcSearch, opts?: any) => GeneralPromise;
        searchCalendar: (data?: DcSearch, opts?: any) => GeneralPromise;
        searchMember: (data?: DcSearch, opts?: any) => GeneralPromise;
    };
    devb: {
        searchCarpark: (data?: DevbSearchCarpark, opts?: any) => GeneralPromise;
        searchLamppost: () => GeneralPromise;
    };
    dh: {
        searchWars: (data?: DhSearchWars, opts?: any) => GeneralPromise;
    };
    effo: {
        searchHoliday: (data?: EffoSearchHoliday, opts?: any) => GeneralPromise;
        isPublicHoliday: () => GeneralPromise;
        isHoliday: () => GeneralPromise;
        isNonOfficeDay: () => GeneralPromise;
    };
    epd: {
        searchApi: (data?: EpdSearchApi, opts?: any) => GeneralPromise;
        searchAqhi: (data?: EpdSearchAqhi, opts?: any) => GeneralPromise;
        latest: {
            searchAqhi: (data?: EpdLatestSearchAqhi, opts?: any) => GeneralPromise;
        }
    };
    geo: {
        searchGeo: (data?: GeodataSearch, opts?: any) => GeneralPromise;
    };
    ha: {
        aedWaitingTime: (data?: HaSearchWaitingTime, opts?: any) => GeneralPromise;
        sopWaitingTime: (data?: HaSearchWaitingTime, opts?: any) => GeneralPromise;
    };
    hkma: {
        validate: {
            bankInfo: (data?: HkmaSearch, opts?: any) => GeneralPromise;
            bankStaff: (data?: HkmaSearch, opts?: any) => GeneralPromise;
            fraud: (data?: HkmaSearch, opts?: any) => GeneralPromise;
            lros: (data?: HkmaSearch, opts?: any) => GeneralPromise;
            secStaff: (data?: HkmaSearch, opts?: any) => GeneralPromise;
            svf: (data?: HkmaSearch, opts?: any) => GeneralPromise;
        };
    };
    hko: {
        searchAstronomy: (data?: HkoSearchAstronomy, opts?: any) => GeneralPromise;
        searchClimate: (data?: HkoSearchClimate, opts?: any) => GeneralPromise;
        searchEarthquake: (data?: HkoSearch, opts?: any) => GeneralPromise;
        searchWeather: (data?: HkoSearch, opts?: any) => GeneralPromise;
        latest: {
            searchGrassTemperature: (data?: HkoLatestSearch, opts?: any) => GeneralPromise;
            searchHumidity: (data?: HkoLatestSearch, opts?: any) => GeneralPromise;
            searchLightning: (data?: HkoLatestSearchLightning, opts?: any) => GeneralPromise;
            searchPressure: (data?: HkoLatestSearch, opts?: any) => GeneralPromise;
            searchSolar: (data?: HkoLatestSearch, opts?: any) => GeneralPromise;
            searchTemperature: (data?: HkoLatestSearch, opts?: any) => GeneralPromise;
            searchTide: (data?: HkoLatestSearch, opts?: any) => GeneralPromise;
            searchUV: (opts?: any) => GeneralPromise;
            searchVisibility: (data?: HkoLatestSearchVisibility, opts?: any) => GeneralPromise;
            searchWind: (data?: HkoLatestSearch, opts?: any) => GeneralPromise;
        }
    };
    hkpf: {
        searchMissing: (data?: HkpfSearchMissing, opts?: any) => GeneralPromise;
        searchReward: (data?: HkpfSearchReward, opts?: any) => GeneralPromise;
    };
    hse: {
        searchHousing: (data?: HseSearch, opts?: any) => GeneralPromise;
        searchFlat: (data?: HseSearch, opts?: any) => GeneralPromise;
    };
    lcsd: {
        searchFacility: (data?: LcsdSearchFacility, opts?: any) => GeneralPromise;
    };
    legco: {
        searchBill: (data?: LegcoSearchBill, opts?: any) => GeneralPromise;
        searchCommittee: (data?: LegcoSearchCommittee, opts?: any) => GeneralPromise;
        searchMeeting: (data?: LegcoSearchMeeting, opts?: any) => GeneralPromise;
        searchMember: (data?: LegcoSearchMember, opts?: any) => GeneralPromise;
        searchMembership: (data?: LegcoSearchMembership, opts?: any) => GeneralPromise;
        searchPolicy: (data?: LegcoSearchPolicy, opts?: any) => GeneralPromise;
        searchVote: (data?: LegcoSearchVote, opts?: any) => GeneralPromise;
        searchWebcast: (data?: LegcoSearchWebcast, opts?: any) => GeneralPromise;
    };
    md: {
        latest: {
            searchTide: (data?: MdLatestSearchTide, opts?: any) => GeneralPromise;
        }
    };
    ogcio: {
        searchAddress: (data?: OgcioSearchAddress, opts?: any) => GeneralPromise;
        searchCarpark: (data?: OgcioSearchCarpark, opts?: any) => GeneralPromise;
        searchLamppost: (data?: OgcioSearchLamppost, opts?: any) => GeneralPromise;
        searchPayment: () => GeneralPromise;
        searchWifi: (data?: OgcioSearchWifi, opts?: any) => GeneralPromise;
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
        searchCTB: (data?: TransportSearch, opts?: any) => GeneralPromise;
        searchMTR: (data?: TransportSearch, opts?: any) => GeneralPromise;
        searchNLB: (data?: TransportSearch, opts?: any) => GeneralPromise;
        searchNWFB: (data?: TransportSearch, opts?: any) => GeneralPromise;
    };
    ferry: {
        searchCB: (data?: TransportSearch, opts?: any) => GeneralPromise;
        searchLF: (data?: TransportSearch, opts?: any) => GeneralPromise;
        searchSF: (data?: TransportSearch, opts?: any) => GeneralPromise;
    };
    post: {
        searchBox: () => GeneralPromise;
        searchMobileOffice: () => GeneralPromise;
        searchOffice: () => GeneralPromise;
        searchPOBox: () => GeneralPromise;
        searchRate: (data?: PostSearchRate, opts?: any) => GeneralPromise;
        searchStation: () => GeneralPromise;
    };
    rail: {
        searchIC: () => GeneralPromise;
        searchLRT: (data?: MTRSearchRail, opts?: any) => GeneralPromise;
        searchMTR: (data?: MTRSearchRail, opts?: any) => GeneralPromise;
        searchTram: (data?: TransportSearch, opts?: any) => GeneralPromise;
    };
}

type PromiseThen<T> = T extends PromiseLike<infer U> ? U : T
type MiddlewareType<T> = T extends (...args: any) => GeneralPromise | SuccessFailPromise ? (...args: Parameters<T>) => Promise<{
    error: boolean;
    data: PromiseThen<ReturnType<T>>;
}> : Middleware<T>;
type Middleware<T> = {
    [key in keyof T]: MiddlewareType<T[key]>
};

export var middleware: {
    gov: Middleware<typeof gov>;
    bank: Middleware<typeof bank>;
    org: Middleware<typeof org>;
}