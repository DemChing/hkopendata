# hkopendata
## Important Notes
Please check if you are going to update your package:
> In `v1.6.0`, some responses in `Bus`, `Rail` and `Ferry` are modified.
> In `v1.7.0`, the environment setup for `Bank` has been updated.

Please make sure to test your code after updating the package.

## Intro
Open data is a trend in the world. By publishing data to public, companies and citizens could benefit from it eventually. However, HKSAR is doing bad on this. The data provided in [一線通](https://data.gov.hk/) doesn't format well which is a nightmare to developer.

There are some serious problems among these data:
- Different field name in data representing the same type of data. (eg location, district, District)
- All language are returned in a single request and with bad field naming. (eg. 地区, district_en, DistrictTC)
- Data are published in completely different format. (eg. json, csv, xml)

Besides, it is a waste of time to spend hours reading the "documentation" which:
- fails to list the correct endpoint or field name
- returns data with different data type
- does not specified parameter restriction on request

Here come's this repo. It tries to resolve those nightmares and help shortening the development period.

## Installation
```
npm i hkopendata
```

Data can be downloaded to perfect some functions. You can download it [here](downloads/) or using the CLI tools. Check the [README](downloads/README.md) for how to handle those data.
```
npm i hkopendata-cli
```

## Information
The project is designed as a 3-layers structure:
1. Retrieve data from different endpoints.
2. Procees and analyse data, at least unify the field names among API. Target is to be capable of extracting useful information from a string.
3. Provide a simple and unified way for developer to access.

This project mainly focus on the data from government. Yet, it also provides the access to open API of local banks and other organizations. You can check detail documentation in these links:
- Government [README](src/gov/README.md)

    It supports searching:
    1. Leisure and Cultural Services Department (康文署) - facilities
    2. Airport Authority Hong Kong (機管局) - flight information
    3. Hospital Authority (醫管局) - service status
    4. Hong Kong Observatory (天文台) - weather report, forecast and history
    5. Housing Department (房署)- estate information
    6. Office of the Government Chief Information Officer (資訊科技總監) / Development Bureau (發展局) - smart lamppost, carpark vacancies
    7. Geospatial Information - Geo Data provided in [GeoData Store](https://geodata.gov.hk/gs/)
    8. Others - Hong Kong address parser, public holidays, HK WiFi, etc.
    9. Department of Health (衞生署) - COVID-19 information
    10. District Councils (區議會) - Attendance, meeting calendar and members
    11. Hong Kong Police Force (香港警務處) - Missing and reward notice

- Bank [README](src/bank/README.md)

    :warning: __WARNING__ :warning:

    All features in this section were tested under the __SANDBOX__ environment. As some banks only provide very limited info on test data, it is very likely that you may encounter bugs on production environment. Use it with caution.

    It supports searching:
    1. Location of ATM / Branch / Deposit Box
    2. Account information of Savings / Current / Time Deposit / Foreign Currency
    3. Foreign Currency Exchange Rate
    4. Insurance Products (eg. travel, car)
    5. Investment Products (eg. precious metals)
    6. Mortgage / Loan Products
    7. Credit Cards

- Other Organizations [README](src/org/README.md)
    1. Hongkong Post (香港郵政) - Postage Rate
    2. Citybus (城巴), New World First Bus (新巴), New Lantao Bus (新大嶼山巴士), LRT Feeder (港鐵巴士)
    3. MTR Lines (地鐵/東鐵/西鐵), Airport Express (機場快綫), LRT Lines (輕鐵), Tramways (電車), Intercity Train (城際直通車)
    4. Star Ferry (天星小輪), New World First Ferry (新渡輪), HKFF (港九小輪) and some local ferry companies

## Classes
Classes are used to make the development more convenient. While not all of them are meaningful, some could be useful in development.

- `Coordinate`
You should expect all coordinate related data would convert to a `Coordinate` Class Object. There are two types of `Coordinate`: `coordinate` under standard `EPSG:4326` (Normal GPS coordinate with `latitude` and `longitude`) and `coordinateHK` under standard `EPSG:2326` (HK1980 grid system coordinate with `easting` and `northing`)

You can convert between `coordinate` and `coordinateHK` using appropriate method. Error(誤差) exists in the conversion. Use it only if neccessary.
```
coordinate.toHK1980(); // change to HK1980
coordinateHK.toLatLong(); // change to Latitude/Longitude (degree)
coordinateHK.toLatLongDms(); // change to Latitude/Longitude (degree, minute and second)
```

You can check the distance (in kilometer) between a `Coordinate` Class object and a `Coordinate Like` object ([See](#coordinate-like)).
```
coordinate.distance(coordinate_like)
```

- `UnitValue`
You should expect all measurement related data would convert to a `UnitValue` Class Object.

```
// Source data (in metre)
{ length: 11 }

// Converted data
UnitValue {
    type: 'length',
    category: 'metre',
    value: 11,
    alterSI: false,
    si: true,
    every: false
}
```

For the units that support SI prefixes, you can alter its scale.
```
// 1cm
let lengthCM = new UnitValue({
    type: 'length',
    category: 'metre',
    scale: 'centi',
    value: 1,
});


// 1km
let lengthKM = new UnitValue({
    type: 'length',
    category: 'metre',
    scale: 'kilo',
    value: 1,
});
```

You can also use `UnitValue.toLocale(lang)` to format it. If you provide a second parameter, it will use locale units instead of just units.
```
let length = new UnitValue({
    type: 'length',
    category: 'metre',
    scale: 'kilo',
    value: 1,
});
length.toLocale();              // 1km
length.toLocale('en', true);    // 1Kilometre
```
`UnitValue` will convert the value to a better scale if applicable. For example, `10000cm` will change to `0.1km`. If you don't like it, you can use `UnitValue.scaleSI(scale)` to change it.
```
// 10,000cm
let length = new UnitValue({
    type: 'length',
    category: 'metre',
    scale: 'centi',
    value: 10000,
});

length.toLocale();              // 0.1km

// change to metre
length.scaleSI();               // or
length.scaleSI('default');

length.toLocale();              // 100m
```

## Locale
Using `utils.ToLocale(data[, lang, pack])` to turn the result into more human readable.

| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `data` | true | all |  | Data to process |  |
| `lang` | false | string (`en`/`tc`) | en | Language of the output |  |
| `pack` | false | string |  | Language pack |  |

```
const utils = require("hkopendata").utils;
let result = {
    district: "Eastern",
    coordinate: Coordinate {
        latitude: 41,
        longitude: 114,
        _raw: { latitude: 41, longitude: 114 },
        _type: 'latlong',
        _system: 'wgs84',
        _standard: 'EPSG:4326'
    }
}

utils.ToLocale(result);
// { District: 'Eastern', Coordinate: { Latitude: 41, Longitude: 114 } }
```

Valid `pack` are the module names of `gov`, `bank`, `org` and `Class name` in lowercase. Select the correct `pack` for more accurate result.

:warning: Same field name could refer to different thing among different `pack`

```
const utils = require("hkopendata").utils;
let result = {
    hourly: 14
}

utils.ToLocale(result, "en", "carparkcartype");
// { Hourly: 14 }
utils.ToLocale(result, "en", "carparkrule");
// { 'Charge per hour': 14 }
```

## Request Configuration
> This feature is added since `v1.5.0`.

This repo uses NPM package `axios` to handle all the request. Sometimes you may need to override the default configuration.

Please keep in mind that all requests in `Bank` __AREN'T__ affected by this config.

```
const utils = require("hkopendata").utils;
utils.CreateAxiosInstance(AxiosRequestConfig);

// change httpsAgent
const https = require("https");
utils.CreateAxiosInstance({
    httpsAgent: new https.Agent({
        // <Your setup>
    })
});
```

## Static Data
Files of static data are stored in `<project-root>/.hkopendata/data` directory (or `<this-repo-root>/data` before `v1.3.0`). There are two types of static data:
1. Persistent Files

This project uses some external data (eg. Airlines, Airports) and data that is very unlikely to change (eg. HK Locations). They won't be updated unless there is a new version published. ~~Please __DO NOT__ delete those files. (ONLY BEFORE `v1.2.0`)~~

2. Cache

Some data are unlikely to change or only update after a long period. They are generated when running some functions (eg. public holidays). They are acted as cache or historical data. Running the function again would return the saved data instead of making ajax. They will be updated automatically.

__UPDATE:__ Since `v1.3.0`, you need to download the file in directory `downloads` and place it to `.hkopendata/data` yourself, and you could update/delete the file if you want. Check [here](downloads/README.md) for detail.

## Accepted Input
There are some functions that accept input with various data types. It will mark as `{Sth Like}` object (eg. `Coordinate Like`)

### Coordinate Like
These values will be a valid `Coordinate Like` object.
```
// An array with two values (longitude/easting first)
obj = [ LONGITUDE, LATITUDE ];
obj = [ EASTING, NORTHING ];

// An object with longitude and latitude / easting and northing
obj = {
    longitude: LONGITUDE,
    latitude: LATITUDE
};
obj = {
    easting: EASTING,
    northing: NORTHING
};

// A Coordinate class object
obj = new Coordinate()
```

## Road Map
- [x] Design general flow to access and process data
- [x] Functions to retrieve and process data
- [ ] Advance process on data (eg. parse CSV/XML data)
    - [x] CSV
    - [x] XML
- [ ] Unify the way of returning data/error
    - [x] Middleware
- [ ] Increase supported API/endpoints (Never ends)

## Changelog (Lastest Version)
### v1.7.0
__ADDED__
- [Bank](src/bank/README.md) API support for Airstar Bank Limited (天星銀行有限公司), Livi Bank Limited (理慧銀行有限公司), Fusion Bank Limited (富融銀行有限公司), Ant Bank (Hong Kong) Limited (螞蟻銀行(香港)有限公司), Ping An OneConnect Bank (Hong Kong) Limited (平安壹賬通銀行(香港)有限公司), WeLab Bank Limited (匯立銀行有限公司) and ZA Bank Limited (眾安銀行有限公司).
- [Ferry](src/org/README.md#ferry-ferry) some routes provide `ETA` information.

__MODIFIED__
- [Bank](src/bank/README.md) bugs fixed and change request configuration.
- [LCSD](src/gov/README.md#leisure-and-cultural-services-department-lcsd) add some datasets of facilities.
- [GEO](src/gov/README.md#geodata-geo) updated the list of supported datasets. Check [here](downloads/geodata.json) or use `hkopendata-cli` to download it.
- Some ancient code with bugs are fixed

__NOTICE__
> In `v1.7.0`, the environment setup for `Bank` has been updated. Please make sure to test your code after update your package.

Full changelog history available [here](/CHANGELOG.md#latest-version).

## Support
This is a one man project developed during free time. Bugs and inconsistence in system are expected (maybe critical).
Developers are :dog: in Hong Kong. Anything without commercial values is meaningless (so is the open data in HK). This project may never be discovered by anyone.

So if you find this useful/useless or have any idea, feel free to contact me.

## License
This project is licensed under the terms of the [MIT](LICENSE.md) license.
