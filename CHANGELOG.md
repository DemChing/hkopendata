## Changelog

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
- Since v1.2.0, directory `data` should only contains `index.js` for fresh install. All JSON files in that directory are either deleted or moved to directory `downloads`.
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