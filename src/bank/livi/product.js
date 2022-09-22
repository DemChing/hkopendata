const lib = require("../../lib/bank-livi");

function handle(data) {
    data = lib.ParseItem(data);

    let item = {};
    for (let key in data) {
        if (key === 'ddTdInd') {
            item.type = (data[key] === 'D' ? 'demand' : 'time') + 'Deposit';
        } else if (key !== 'list') {
            item[key] = data[key];
        }
    }

    return data.list.map(temp => ({
        ...item,
        ...lib.ParseItem(temp),
    }))
}

module.exports = handle;