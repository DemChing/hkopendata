const holiday = require("./holiday");

module.exports = {
    searchHoliday: holiday.search,
    isPublicHoliday: holiday.isPublic,
    isHoliday: holiday.isHoliday,
    isNonOfficeDay: holiday.isOffice,
}