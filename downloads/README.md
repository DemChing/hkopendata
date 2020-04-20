## Summary
This directory only store some supplementary data that do not affect the function in this repository. They were stored in directory `data` before `v1.2.0` ([CHANGELOG](/CHANGELOG.md#v120)).

This update is to:
1. Reduce the size of npm module upon fresh install (4MB+ to 400kB+)
2. Reduce the reliance on those data for function to work
3. Allow developer to choose whether to include the extra data

## Usage
To use the data, download the relevant files in `downloads` and place the file in the directory `data` of your installation path.

You can modify the json file with the same format to meet your needs (e.g. location name, airlines, airports).

## Files
Files below that marked as `Generate at Runtime` would be generated and updated automatically after accessing those data.

| Filename | Description | Relevant Package | Purpose | Generate at Runtime | Remarks |
| --- | --- | --- | --- | --- | --- |
| `flat/*.json` | Flat data of each disctrict | `hse` | Improve performance as most of the raw data are over 10MB | `true` | Remember to place the file in path `data/flat` instead of just `data` |
| `airlines.json` | Worldwide airlines data | `aahk` | Supplementary data | `false` | API will only return the `ICAO` code of the airline without its name |
| `airports.json` | Worldwide airports data | `aahk` | Supplementary data | `false` | API will only return the `IATA` code of the airport without its name |
| `geodata.json` | List of supported dataset | `geo` | Validation | `false` | No validation of dataset id if the file is not present |
| `hk-holiday.json` | List of public holiday | `effo` | Cache | `true` |  |
| `hk-lamppost.json` | Data of smart lamppost | N/A | Reference | `false` | File not in use |
| `hk-location.json` | Data of Hong Kong location | N/A | Standardize | `false` | Some functions uses this file to standardize the name of regions, districts and LegCo districts |
| `hko-station.json` | Data of weather stations of Hong Kong Observary | `hko` | Validation | `false` | No validation of station code if the file is not present |
| `locale.json` | Locale of each package | N/A | Development | `false` | Full locale in directory `src/locale`. File not in use |
| `units.json` | Data of units used in class `UnitValue` | N/A | Development | `false` | Full data in directory `src/units`. File not in use |