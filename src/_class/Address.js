class Address {
    constructor(address) {
        this._raw = address;
        const ogcio = require("../gov/ogcio");
        return (async () => {
            let res = await ogcio.searchAddress({
                query: this._raw,
            });
            this.location = res[0];
            return this;
        })();
    }
}

module.exports = Address;