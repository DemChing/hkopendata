const moment = require("moment");
moment.suppressDeprecationWarnings = true;
moment.locale("yue", {
    parentLocale: "zh-hk",
    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays: '禮拜日_禮拜一_禮拜二_禮拜三_禮拜四_禮拜五_禮拜六'.split('_'),
    weekdaysShort: '週日_週一_週二_週三_週四_週五_週六'.split('_'),
    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
    longDateFormat: {
        LT: 'Ah點mm分',
        LTS: 'Ah點mm分ss秒',
        L: 'YYYY-MM-DD',
        LL: 'YYYY年M月D號',
        LLL: 'LL LT',
        LLLL: 'LLdddd LT',
        l: 'YYYY-M-D',
        ll: 'LL',
        lll: 'LLL',
        llll: 'LLddd LT'
    },
    meridiemParse: /午夜|凌晨|早上|上午|朝早|上晝|中午|正午|下午|下晝|晏晝|晚上|夜晚|a\.?m\.?|p\.?m\.?|n\.n\.|m\.n\.?/i,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        meridiem = meridiem.replace(".", "");
        if (/^(凌晨|早上|上午|朝早|上晝|am)$/i.test(meridiem)) {
            return hour;
        } else if (meridiem === "中午") {
            return hour >= 11 ? hour : hour + 12;
        } else if (/^(下午|下晝|晏晝|晚上|夜晚|pm?)$/i.test(meridiem)) {
            return hour + 12;
        } else if (/^(正午|nn?)$/i.test(meridiem)) {
            return 12;
        } else if (/^(午夜|mn?)$/i.test(meridiem)) {
            return 0;
        }
    },
    meridiem: function (hour, minute, isLower) {
        var hm = hour * 100 + minute;
        if (hm == 0) {
            return '午夜';
        } else if (hm < 600) {
            return '凌晨';
        } else if (hm < 900) {
            return '朝早';
        } else if (hm < 1130) {
            return '上晝';
        } else if (hm == 1200) {
            return '正午';
        } else if (hm < 1230) {
            return '中午';
        } else if (hm < 1800) {
            return '晏晝';
        } else {
            return '夜晚';
        }
    },
    preparse: function (input) {
        var chinese = ["零|〇|０", "一|１", "二|２", "三|３", "四|４", "五|５", "六|６", "七|７", "八|８", "九|９", "十", "十一", "十二"];
        var spoken = {
            "$1點": /(\d+)時/g,
            "$1號": /(\d+)日/g,
            "禮拜": /星期/g
        }
        chinese.reverse().map((v, i) => {
            var regex = new RegExp(`(星期|禮拜|週)?(${v})`, "g");
            input = input.replace(regex, ($0, $1) => $1 ? $0 : 12 - i);
        })
        for (var key in spoken) {
            input = input.replace(spoken[key], key)
        }
        return input;
    },
    calendar: {
        sameDay: '[今日]LT',
        nextDay: '[聽日]LT',
        nextWeek: '[下]ddddLT',
        lastDay: '[尋日]LT',
        lastWeek: '[上]ddddLT',
        sameElse: 'L'
    },
    dayOfMonthOrdinalParse: /\d{1,2}(號|月|週)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '號';
            case 'M':
                return number + '月';
            case 'w':
            case 'W':
                return number + '週';
            default:
                return number;
        }
    },
    relativeTime: {
        future: '%s內',
        past: '%s前',
        s: '幾秒',
        ss: '%d秒',
        m: '1分鐘',
        mm: '%d分鐘',
        h: '1個鐘',
        hh: '%d個鐘',
        d: '1日',
        dd: '%d日',
        M: '1個月',
        MM: '%d個月',
        y: '1年',
        yy: '%d年'
    }
})

module.exports = moment;