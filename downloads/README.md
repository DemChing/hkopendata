## Summary
This directory only store some supplementary data that do not affect the function in this repository. They were stored in directory `data` before `v1.2.0` ([CHANGELOG](/CHANGELOG.md#v120)).

This update is to:
1. Reduce the size of npm module upon fresh install (4MB+ to 400kB+)
2. Reduce the reliance on those data for function to work
3. Allow developer to choose whether to include the extra data

__UPDATED:__ In `v1.3.0`, the file `hk-ferry.json` is added and some functions would __NOT WORK__ without it.

## Usage
To use the data, download the relevant files in this directory (`/downloads`). ~~Then place the file to the directory `/data` under the package installation path (e.g. `/path_to_your_project/node_modules/hkopendata/data`).~~

From `v1.3.0`, you should place the file to the directory `/path_to_your_project/.hkopendata/data` in your project root. Create the directory if it does not exist. Or you can install the CLI package `hkopendata-cli` ([git](https://github.com/DemChing/hkopendata-cli)|[npm](https://www.npmjs.com/package/hkopendata-cli)) to manage your data.

You can modify the json file with the same format to meet your needs (e.g. location name, airlines, airports).

## Files
Files below that marked as `Generate at Runtime` would be generated and updated automatically after accessing those data.

| Filename | Description | Relevant Package | Purpose | Generate at Runtime | Remarks |
| --- | --- | --- | --- | --- | --- |
| `flats/*.json` | Flat data of each district | `hse` | Improve performance as most of the raw data are over 10MB | `true` | Remember to place the file in path `data/flats` instead of just `data` |
| `airlines.json` | Worldwide airlines data | `aahk` | Supplementary data | `false` | API will only return the `ICAO` code of the airline without its name |
| `airports.json` | Worldwide airports data | `aahk` | Supplementary data | `false` | API will only return the `IATA` code of the airport without its name |
| `epd-station.json` | Data of air quality monitoring stations of Environmental Protection Department | `epd` | Validation / Supplementary data | `false` | No validation of station code if the file is not present |
| `geodata.json` | List of supported dataset | `geo` | Validation | `false` | No validation of dataset id if the file is not present |
| `hk-ferry.json` | Data of ferry related information | `ferry` | Supplementary data | `false` | API will only return the abbreviation name of pier and company for `searchCB`. `searchLF` will __NOT__ function without this file |
| `hk-holiday.json` | List of public holiday | `effo` | Cache | `true` |  |
| `hk-lamppost.json` | Data of smart lamppost | N/A | Reference | `false` | File not in use |
| `hk-location.json` | Data of Hong Kong location | N/A | Standardize | `false` | Some functions uses this file to standardize the name of regions, districts and LegCo districts |
| `hko-station.json` | Data of weather stations of Hong Kong Observary | `hko` | Validation / Supplementary data | `false` | No validation of station code if the file is not present |
| `locale.json` | Locale of each package | N/A | Development | `false` | Full locale in directory `src/locale`. File not in use |
| `units.json` | Data of units used in class `UnitValue` | N/A | Development | `false` | Full data in directory `src/units`. File not in use |