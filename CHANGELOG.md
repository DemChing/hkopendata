## Changelog

## Latest Version
### v1.7.0
__ADDED__
- [Bank](src/bank/README.md) API support for Airstar Bank Limited (天星銀行有限公司), Livi Bank Limited (理慧銀行有限公司), Fusion Bank Limited (富融銀行有限公司), Ant Bank (Hong Kong) Limited (螞蟻銀行(香港)有限公司), Ping An OneConnect Bank (Hong Kong) Limited (平安壹賬通銀行(香港)有限公司), WeLab Bank Limited (匯立銀行有限公司) and ZA Bank Limited (眾安銀行有限公司).
- [Ferry](src/org/README.md#ferry-ferry) some routes provide `ETA` information.

__MODIFIED__
- [Bank](src/bank/README.md) bugs fixed and change request configuration.

__NOTICE__
> In `v1.7.0`, the environment setup for `Bank` has been updated. Please make sure to test your code after update your package.
### v1.6.0
__ADDED__
- [Bus](src/org/README.md#bus-bus) Kowloon Bus (九巴) and Green Minibus (綠色專線小巴) route and ETA information

__MODIFIED__
- [Bus](src/org/README.md#bus-bus) LRT Feeder (港鐵巴士) add ETA information (Currently no data available)
- [Rail](src/org/README.md#rail-rail) LRT (輕鐵) added ETA information
- [Ferry](src/org/README.md#ferry-ferry) local licensed ferry added 10 routes

__NOTICE__
In `v1.6.0`, some responses in `Bus`, `Rail` and `Ferry` are modified. Please make sure to test your code after update your package.
### v1.5.0
__ADDED__
- [HKO](src/gov/README.md#hong-kong-observatory-hko) latest weather information
- [EPD](src/gov/README.md#environmental-protection-department-epd) latest and historical AQHI information
- [MD](src/gov/README.md#marine-department-md) latest weather information
- Allow user to customize `axios` request configuration [See](README.md#request-configuration)
- Locale support: Simplified Chinese (`sc`)

__MODIFIED__
- Optimize Typescript declaration files `index.d.ts`
- Fix static files save to `/data` instead of `/.hkopendata/data`
- Other code optimization
### v1.4.0
__ADDED__
- [LegCo](src/gov/README.md#legislative-council-legco) information
- Typescript declaration files `index.d.ts`
- Simple [middleware](src/middleware/README.md) to handle success and fail response

__MODIFIED__
- [Bank](src/bank/README.md#initiation-v140) Initiation method updated
- [Ferry](src/org/README.md#ferry-ferry) local licensed ferry added 2 routes

## Previous Versions
### v1.3.0
__ADDED__
- [Ferry](src/org/README.md#ferry-ferry) information
- Add [CLI](https://github.com/DemChing/hkopendata-cli) package to manage supplementary data.

__MODIFIED__
- Update the flow of handling supplementary data.

### v1.2.0
__ADDED__
- Add directory `downloads` to store supplementary data.
- [District Councils](src/gov/README.md#district-councils-dc) related information
- [Missing / Reward Persons](src/gov/README.md#hong-kong-police-force-hkpf) notice
- New dependency `fast-xml-parser` to process XML type data.

__MODIFIED__
- Revamp the flow of handling supplementary data, locale and units.
- Handling input encoding for CSV processing.

__REMOVED__
- Remove JSON files in directory `data`

__NOTICE__

Here are the information about the update on supplementary data.
- Since `v1.2.0`, directory `data` should only contains `index.js` for fresh install. All JSON files in that directory are either deleted or moved to directory `downloads`.
- JSON files will still be generated and saved to directory `data` at runtime which is the same as previous version.
- Files in directory `downloads` are not required for this repository to work. They are just supplementary data to enhance the function or performamce.

For detail, go [here](downloads/README.md).

### v1.1.0
__ADDED__
- [Wi-Fi HK](src/gov/README.md#office-of-the-government-chief-information-officer-ogcio) related information
- [COVID-19](src/gov/README.md#department-of-health-dh) information
- [Bus](src/org/README.md#bus-bus) and [Rail](src/org/README.md#rail-rail) information
- New dependency `csv-parse` to process CSV type data.

### v1.0.0
__ADDED__
- Initial Commit