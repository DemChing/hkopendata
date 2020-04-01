## Intro
Different government departments provide varies API for public to access their data. This section is grouped by the department, bureau or organizations. Include the correct module to access the corresponding API.

## Usage
First, include the relevant module.
```
// require Airport Authority only
const aahk = require("hkopendata").gov.aahk;

// or require multiple module
const { aahk, devb } = require("hkopendata").gov;
```

Next, do the searching. All the methods return a promise. You should handle the result or error properly.
```
aahk.searchFlight()
    .then(result => {
        // Process the result
    })
    .catch(error => {
        // Process the error
    })
```

## Airport Authority (aahk)
- `searchFlight(params)` Flight information

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.date` | false | string `YYYY-MM-DD` | Current Day | Date of record | 91 days before to 14 days after |
| `params.arrival` | false | boolean | true | Arrival/Departure flight |  |
| `params.cargo` | false | boolean | true | Cargo/Passenger flight |  |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

## Development Bureau (devb)
- `searchLamppost()` Data collected by smart lamppost in Kowloon East
- `searchCarpark(params)` Carpark Information provided by Energizing Kowloon East Office

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.id` | false | number/string/\[number/string\] |  | Carpark id | Accept `,` separated string |
| `params.vehicle` | false | number `[0 - 4]` |  | Vehicle type | 0 - Private Car<br>1 - Light Goods Vehicle<br>2 - Heavy Goods Vehicle<br>3 - Coach<br>4 - Motorcycle |
| `params.carpark` | false | number `[0 - 2]` |  | Carpark type | 0 - Multi-storey<br>1 - Off-street<br>2 - Metered |
| `params.full` | false | boolean | false | Complete carpark details |  |
| `params.boundary` | false | string/\[Corrdinate Like\] |  | Bottom-left and top-right coordinate (in WGS84) (longitude & latitude) | [Corrdinate Like Object](/README.md#coordinate-like) |
| `params.lang` | false | string (`en`/`tc`) | en | Language of the result | not support `sc` |

## Efficiency Office (effo)
- `searchHoliday(params)` Search public holiday in year. Static files will be generated. [See](/README.md#static-data)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.year` | false | string `YYYY` | Current year | Holidays in this year | Valid since 2018 |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

- `isPublicHoliday(date)` Check if the given date is public holiday

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `date` | true | string `YYYY-MM-DD` |  | Search date |  |

- `isHoliday(date)` Check if the given date is holiday (marked red in calendar)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `date` | true | string `YYYY-MM-DD` |  | Search date |  |


- `isNonOfficeDay(date, days)` Check if the given date is non office day

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `date` | true | string `YYYY-MM-DD` |  | Search date |  |
| `days` | false | number/\[number\] | 5 | Non-office day | State 6 if it is 6-day work (start from monday)<br>State [3, 6, 7] if office is off on Wed, Sat and Sun |

## Geodata
- `searchGeo(params)` Search data from [GeoData](https://geodata.gov.hk/gs/)

__Parameters (General)__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.id` | true | string |  | Dataset UUID | Go to official website or check file `/data/geodata.json` |
| `params.v` | false | string | 1.0.0 | GeoData API version |  |
| `params.boundary` | false | string/\[Corrdinate Like\] |  | Bottom-left and top-right coordinate (in WGS84) (longitude & latitude) | [Corrdinate Like Object](/README.md#coordinate-like) |
| `params.boundaryHK` | false | string/\[Corrdinate Like\] |  | Bottom-left and top-right coordinate (in HK1980) (easting & northing) | [Corrdinate Like Object](/README.md#coordinate-like) |
| `params.lang` | false | string (`all`/`en`/`tc`) | all | Language of the result |  |

__Parameters (Optional)__
This API supports extra parameters but it completely depends on the dataset. Please go to [GeoData](https://geodata.gov.hk/gs/) to get the corresponding parameter.
__*__ The parameter name should be s1, s2, s3, etc.

## Hospital Authority (ha)
- `aedWaitingTime(params)` Accident and Emergency waiting time

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

- `sopWaitingTime(params)` Specialist outpatient services waiting time

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

## Hong Kong Observatory
- `searchWeather(params)` Get weather information

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-5]` | 0 | Type of information | 0 - Weather Forecast<br>1 - 9-day Weather Forecast<br>2 - Weather Report<br>3 - Summary of Weather Warning<br>4 - Detail of Weather Warning<br>5 - Special Waether Tips |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

- `searchEarthquake(params)` Get earthquake information

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-1]` | 0 | Type of information | 0 - Earthquake message<br>1 - Locally felt report |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

- `searchAstronomy(params)` Get astronomy related information

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-5]` | 0 | Type of information | 0 - Tide heights hourly<br>1 - Time and heights of high and low tides<br>2 - Time of sunrise, sun transit and sunset<br>3 - Time of moonrise, moon transit and moonset<br>4 - Lightning count<br>5 - Mean visibility in 10 minutes |
| `params.year` | false | string `YYYY`<br>Tides: `[2019-2021]`<br>Sun/Moon: `[2018-2021]` |  | Year of the result | Only applicable to `tides`, `sun` and `moon` related details. |
| `params.month` | false | string `MM` `[01-12]` |  | Month of the result | Only applicable to `tides`, `sun` and `moon` related details. Must specify `params.year` together. |
| `params.day` | false | string `DD` `[01-31]` |  | Day of the result | Only applicable to `tides`, `sun` and `moon` details. Must specify `params.year` and `params.month` together. |
| `params.hour` | false | string `HH` `[01-24]` |  | Hour of the result | Only applicable to `tides` details.  Must specify `params.year`, `params.month` and `params.day` together. |
| `params.station` | false | string |  | Target station | Only applicable to `tides` details. Station code can be found in file `/data/hko-station.json` with parameter `a=1` |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result | Only applicable to type `lightning` and `visibility` |

- `searchClimate(params)` Get climate information

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-2]` | 0 | Type of information | 0 - Daily Mean Temperature<br>1 - Daily Minimum Temperature<br>2 - Daily Maximum Temperature |
| `params.year` | false | string `YYYY` |  | Year of the result | Depends on each station |
| `params.month` | false | string `MM` `[01-12]` |  | Month of the result | Must specify `params.year` together. |
| `params.station` | false | string |  | Target station | Station code can be found in file `/data/hko-station.json` with parameter `w=1` |

## Housing Authority (hse)
- `searchHousing(params)` Search location data of housings or buildings under Housing Authority

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-3]` | 0 | Type of information | 0 - Public housing estates (公屋)<br>1 - HOS (房委會居屋) / PSPS (私人機構居屋) / GSH (綠置居) courts<br>2 - Shopping centres<br>3 - Flatted factories |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

- `searchFlat(params, opts)` Search public rental flat information in district
:warning: __WARNING__ :warning:
This function will retrieve all flats, buildings and estates information within the district. For better performance, the function will try to read the static data in `/data/flats` first. If data is not exist, it will retrieve live data. However, it may take a long time and lower the performance (Most raw data are over 10MB). Use it with caution.

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-17]` | 0 | Type of information | 0 - Central & Western (中西區)<br>1 - Wan Chai (灣仔)<br>2 - Eastern (東區)<br>3 - Southern (南區)<br>4 - Yau Tsim Mong (油尖旺)<br>5 - Sham Shui Po (深水埗)<br>6 - Kowloon City (九龍城)<br>7 - Wong Tai Sin (黃大仙)<br>8 - Kwun Tong (觀塘)<br>9 - Tsuen Wan (荃灣)<br>10 - Tuen Mun (屯門)<br>11 - Yuen Long (元朗)<br>12 - North (北區)<br>13 - Tai Po (大埔)<br>14 - Sai Kung (西貢)<br>15 - Sha Tin (沙田)<br>16 - Kwai Tsing (葵青)<br>17 - Islands (離島) |
| `opts.update` | false | boolean |  | Force retrieve the live data and update its static file | :warning: Use it with caution. |

## Leisure and Cultural Services Department (lcsd)
- `searchFacility(params)` Search facilities under LCSD

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-46]` | 1 | Type of information | 0 - Gerneral information of all types<br>1 - Road Safety Towns (交通安全城)<br>2 - Fitness Walking Tracks (健步行徑)<br>3 - Fitness Rooms (健身室)<br>4 - Fitness Equipment (健身器械)<br>5 - Children's Play Rooms (兒童遊戲室)<br>6 - Play Equipment for All Children (共融遊樂設施)<br>7 - Leisure Venues for Holding Wedding Ceremonies (可供舉行婚禮的康樂場地)<br>8 - Barbecue Sites (燒烤場)<br>9 - Pet Gardens (寵物公園)<br>10 - Jogging Tracks (緩跑徑)<br>11 - Open Air Theatres (露天劇場)<br>13 - Soccer Pitches (5-a-side) (Hard-surface) (足球場 (五人) (硬地))<br>14 - Soccer Pitches (7-a-side) (Hard-surface) (足球場 (七人) (硬地))<br>15 - Soccer Pitches (7-a-side) (Artificial Turf) (足球場 (七人) (人造草地))<br>16 - Soccer Pitches (11-a-side) (Artificial Turf) (足球場 (十一人) (人造草地))<br>17 - Soccer Pitches (7-a-side) (Natural Turf) (足球場 (七人) (天然草地))<br>18 - Soccer Pitches (11-a-side) (Natural Turf) (足球場 (十一人) (天然草地))<br>19 - Cricket Ground (Artificial Turf) (板球場 (人造草地))<br>20 - Cricket Ground (Natural Turf) (板球場 (天然草地))<br>21 - Cricket Ground (Free) (Outdoor) (板球場 (免費) (戶外))<br>22 - Volleyball Courts (Free) (Outdoor) (排球場 (免費) (戶外))<br>23 - Volleyball Courts (Beach) (排球場 (沙灘))<br>24 - Rugby Pitches (Artificial Turf) (欖球場 (人造草地))<br>25 - Rugby Pitches (Natural Turf) (欖球場 (天然草地))<br>26 - Hockey Grounds (Artificial Turf) (曲棍球場 (人造草地))<br>27 - Baseball Pitches (Natural Turf) (棒球場 (天然草地))<br>28 - Table Tennis Tables (Outdoor) (乒乓球檯 (戶外))<br>29 - Handball Courts (Free) (Outdoor) (手球場 (免費) (戶外))<br>30 - Netball Courts (Free) (Outdoor) (投球場 (免費) (戶外))<br>31 - Cycling Tracks and Grounds (單車徑/場)<br>32 - Archery Ranges (射箭場)<br>33 - Skateboard Ground (滑板場)<br>34 - Roller Skating Rinks (滾軸溜冰場)<br>35 - Roller Hockey Court (Free) (Outdoor) (滾軸曲棍球場 (免費) (戶外))<br>36 - Skateparks (極限運動場)<br>37 - Basketball Courts (Free) (Outdoor) (籃球場 (免費) (戶外))<br>38 - Tennis Courts (網球場)<br>39 - Tennis Courts (Practice) (Free) (Outdoor) (網球場 (練習) (免費) (戶外))<br>40 - Badminton Courts (Free) (Outdoor) (羽毛球場 (免費) (戶外))<br>41 - Bowling Greens (草地滾球場)<br>42 - Sports Grounds (運動場)<br>43 - Gateball Courts (Free) (Outdoor) (門球場 (免費) (戶外))<br>44 - Sports Centres (體育館)<br>45 - Model Boat Pools (模型船池)<br>46 - Model Car Play Area (模型車場) |

## Office of the Government Chief Information Officer (ogcio)
- `searchPayment()` Online payment transactions of different Bureau/Department in the last 36 months

- `searchAddress(params)` Breakdown a given address
:warning: __WARNING__ :warning:
The breakdown may return incorrect result if:
1. Input address is incorrect (eg. typo)/cannot be recognized (some villages in N.T. or newly completed estate)
2. Another similar address is found

Please provide an address as detail as possible for accurate result. This API won't process floor or flat details at this moment.

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.query` | true | string |  | Target address | Could be `en`/`tc` address |
| `params.limit` | false | number | 0 | Number of result |  |

- `searchLamppost(params)` Positioning data of smart lamppost

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-6]` | 0 | Type of information | 0 - All devices<br>1 - Lamppost<br>2 - BLE iBeacon<br>3 - BLE Eddystone<br>4 - NFC<br>5 - RFID<br>6 - Geo Marker |
| `params.id` | false | string |  | Lamppost ID |  |
| `params.boundary` | false | string/\[Corrdinate Like\] |  | Bottom-left and top-right coordinate (in WGS84) (longitude & latitude) | [Corrdinate Like Object](/README.md#coordinate-like) |
| `params.boundaryHK` | false | string/\[Corrdinate Like\] |  | Bottom-left and top-right coordinate (in HK1980) (easting & northing) | [Corrdinate Like Object](/README.md#coordinate-like) |

- `searchCarpark(params)`  Carpark Information provided by Transport Department and  Energizing Kowloon East Office

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-1]` | 0 | Type of information | 0 - Basic information<br>1 - Vacancy |
| `params.id` | false | string/\[string\] |  | Carpark id | Accept `,` separated string |
| `params.vehicle` | false | number `[0 - 5]` |  | Vehicle type | 0 - Private Car<br>1 - Light Goods Vehicle<br>2 - Heavy Goods Vehicle<br>3 - Coach<br>4 - Motorcycle<br>5 - Container Vehicle |
| `params.boundary` | false | string/\[Corrdinate Like\] |  | Bottom-left and top-right coordinate (in WGS84) (longitude & latitude) | [Corrdinate Like Object](/README.md#coordinate-like) |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result | `sc` may fallback to `tc` |
