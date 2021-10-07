## Intro
This section will collect API published by organizations that are neither government department or banks.
Currently, only API from Hongkong Post (香港郵政) is available.

__UPDATE:__ Bus and rail information are available since v1.1.0.

## Hongkong Post (post)
- `searchBox()` Street Box information

- `searchPOBox()` PO Box information

- `searchOffice()` Post Office information

- `searchMobileOffice()` Mobile Post Office information

- `searchStation()` iPostal Station information

- `searchRate(params)` Postage Rate information

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-17]` | 0 | Type of information | 0 - Local Ordinary Mail<br>1 - Local Registered Mail<br>2 - Local Parcel<br>3 - Local Courier Post<br>4 - Local Smart Post<br>5 - Local Bulk Mail<br>6 - Local Bulk Periodicals Services<br>7 - Overseas Air/Surface Mail<br>8 - Overseas Air/Surface Registered Mail<br>9 - Overseas Surface Parcel<br>10 - Overseas Air Parcel<br>11 - Overseas Speedpost<br>12 - Overseas E-Express<br>13 - Overseas iMail Services<br>14 - Overseas Bulk Lightweight Air Mail<br>15 - Overseas Bulk Air Mail<br>16 - Overseas Bulk Periodicals Services<br>17 - Business Reply Services |

## Bus (bus)
__IMPORTANT:__ Please be careful when specifying `params.route` and `params.stop`. Some search types require __ID__ while some require __NAME__ (eg. 1A, K51).

- `searchCTB(params)` / `searchNWFB(params)` Bus information from Citybus (城巴) or New World First Bus (新巴)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-4]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Estimated Time Arrival<br>3 - Stop Info<br>4 - Company Info |
| `params.route` | false | string |  | Route | Route __NAME__. Required when `params.type` equals `1` or `2` |
| `params.stop` | false | string |  | Stop | Stop __ID__. Required when `params.type` equals `2` or `3` |
| `params.dir` | false | number `[0-1]` |  | Direction | 0 - Inbound<br>1 - Outbound<br><br>Required when `params.type` equals `1` |

- `searchNLB(params)` Bus information from New Lantao Bus (新大嶼山巴士)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-2]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Estimated Time Arrival |
| `params.route` | false | string |  | Route | Route __ID__. Required when `params.type` equals `1` or `2` |
| `params.stop` | false | string |  | Stop | Stop __ID__. Required when `params.type` equals `2` |

- `searchMTR(params)` Bus information from LRT Feeder (港鐵巴士)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-2]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Fare<br>3 - Estimated Time Arrival (Currently no data available) |
| `params.route` | false | string |  | Route | Route __NAME__. Required when `params.type` equals `1`, `2` or `3` |

- `searchKMB(params)` Bus information from Kowloon Bus (九巴)

| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-5]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Stop Info<br>3 - ETA (specific stop of route)<br>4 - ETA (specific stop of all routes)<br>5 - ETA (all stops of specific route) |
| `params.route` | false | string |  | Route | Route __NAME__. Required when `params.type` equals `1`, `3` or `5` |
| `params.service` | false | string |  | Route Service Type | Required when `params.type` equals `1`, `3` or `5` |
| `params.dir` | false | number `[0-1]` |  | Direction | 0 - Inbound<br>1 - Outbound<br><br>Required when `params.type` equals `1` |
| `params.stop` | false | string |  | Stop | Stop __ID__. Required when `params.type` equals `2`, `3` or `4` |

- `searchGMB(params)` Bus information from Green Minibus (綠色專線小巴)

| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-5]` | 0 | Type of information | 0 - Route Info<br>1 - Routes of Stop<br>2 - Stops of Route<br>3 - Stop Info<br>4 - ETA (specific stop of route)<br>5 - ETA (specific stop of all routes) |
| `params.region` | false | string |  | Region | 0 - Hong Kong Island<br>1 - Kowloon<br>2 - New Territories |
| `params.route` | false | string |  | Route | Route __NAME__. |
| `params.routeId` | false | string |  | Route | Route __ID__. |
| `params.routeSeq` | false | string |  | Route | Route __SEQUENCE__. |
| `params.stop` | false | string |  | Stop | Stop __ID__. |
| `params.stopSeq` | false | string |  | Stop | Stop __SEQUENCE__. |

| Purpose | `params.type` | Requirement |
| --- | --- | --- |
| All route name in specific region | `0` | `params.region` |
| Specific route info in specific region | `0` | Provide either set of data:<br>1. `params.region` and `params.route`<br>2. `params.routeId` |
| All routes in specific stop | `1` | `params.stop` |
| All stops in specific direction of route | `2` | `params.routeId` and `params.routeSeq` |
| Stop Info | `3` | `params.stop` |
| ETA of a specific stop of a specific direction of a route | `4` | `params.routeId`, `params.routeSeq` and `params.stopSeq` |
| ETA of a specific stop of a __ALL__ directions of a route | `4` | `params.routeId` and `params.stop` |
| ETA of a specific stop of a __ALL__ routes | `5` | `params.stop` |

## Rail (rail)
__IMPORTANT:__ Please be careful when specifying `params.route` and `params.stop`. Some search types require __ID__ while some require __NAME/CODE__ (eg. WRL, 614P).

- `searchIC()` Rail information from Intercity Train (城際直通車 - 廣九/滬九/京九)

- `searchMTR(params)` Rail information from MTR Lines (地鐵/東鐵/西鐵) and Airport Express (機場快綫)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-4]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Estimated Time Arrival<br>3 - Fares of MTR lines<br>4 - Fares of Airport Express |
| `params.route` | false | string |  | Route | Route __CODE__. Required when `params.type` equals `1` or `2` |
| `params.stop` | false | string |  | Stop | Stop __CODE__. Required when `params.type` equals `2` |
| `params.from` | false | string |  | Origin Stop | Stop __ID__. Required when `params.type` equals `3` or `4` |
| `params.to` | false | string |  | Destination Stop | Stop __ID__. Required when `params.type` equals `3` or `4` |
| `params.dir` | false | number `[0-3]` | 0 | Direction | 0 - Down<br>1 - UP<br>2 - Down (branch)<br>3 - Up (branch)<br><br>Accepted when `params.type` equals `0`, `1` or `2`. Value `2` and `3` only applicable to East Rail Line (LoK Ma Chau) and Tseung Kwan O Line (LOHAS Park) |
| `params.lang` | false | string (`en`/`tc`) | en | Language of the result | Only applicable when `params.type` is `2` and an error message exists |

- `searchLRT(params)` Rail information from LRT Lines (輕鐵)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-2]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Fares<br>3 - Estimated Time Arrival |
| `params.route` | false | string |  | Route | Route __NAME__. Required when `params.type` equals `1` |
| `params.from` | false | string |  | Origin Stop | Stop __ID__. Required when `params.type` equals `2` |
| `params.to` | false | string |  | Destination Stop | Stop __ID__. Required when `params.type` equals `2` |
| `params.dir` | false | number `[0-1]` | 0 | Direction | 0 - Down<br>1 - UP<br>2 - Down (branch)<br>3 - Up (branch)<br><br>Accepted when `params.type` equals `0` or `1` |
| `params.stop` | false | string |  | Stop | Stop __ID__. Required when `params.type` equals `3` |

- `searchTram(params)` Rail information from Tramways (電車)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-1]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of All Route |
| `params.route` | false | string |  | Route | Route __NAME__. Accepted when `params.type` equals `0` |
| `params.stop` | false | string |  | Stop | Stop __CODE__. Accepted when `params.type` equals `1` |
| `params.dir` | false | number `[0-1]` | 0 | Direction | 0 - Eastbound<br>1 - Westbound<br><br>Accepted when `params.type` equals `1` |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

## Ferry (ferry)
__IMPORTANT:__ Some methods rely on the data in `/downloads/hk-ferry.json`. It is recommended to download the file and place it to `/data`.

- `searchSF(params)` Ferry information from Star Ferry (天星小輪)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-2]` | 0 | Type of information | 0 - Route Info<br>1 - Timetable<br>2 - Fare |
| `params.route` | true | number `[0-1]` | 0 | Route | 0 - Central to Tsim Sha Tsui<br>1 - Wan Chai to Tsim Sha Tsui |
| `params.dir` | false | number `[0-1]` | 0 | Direction | 0 - Inbound<br>1 - Outbound |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

- `searchCB(params)` Ferry information of cross border ferry
__IMPORTANT:__ This method uses data in `/downloads/hk-ferry.json`. It is not compulsory but recommended to download the file.

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.dir` | false | number `[0-1]` | 0 | Direction | 0 - Arrival<br>1 - Departure |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |

- `searchLF(params)` Ferry information of local licensed ferry

__IMPORTANT:__ This method uses data in `/downloads/hk-ferry.json`. It is __COMPULSORY__ to download the file. It would __NOT__ function if the file does not exist.

__IMPORTANT:__ The route information does not update automatically as it is copied from the source documentation PDF. Make a pull request or notify me to update if anything has changed.

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-3]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Timetable<br>3 - Fare |
| `params.route` | true | number `[0-23]` | 0 | Route | 0 - Central to Sok Kwu Wan<br>1 - Central to Yung Shue Wan<br>2 - Central to Peng Chau<br>3 - Central to Mui Wo<br>4 - Peng Chau to Cheung Chau<br>5 - Central to Cheung Chau<br>6 - Central to Discovery Bay<br>7 - Ma Wan to Central<br>8 - Ma Wan to Tsuen Wan<br>9 - North Point to Hung Hom<br>10 - North Point to Kowloon City<br>11 - North Point to Kwun Tong<br>12 - Sai Wan Ho to Kwun Tong<br>13 - Sai Wan Ho to Sam Ka Tsuen<br>14 - Discovery Bay to Mui Wo<br>15 - Tuen Mun to Tai O<br>16 - Aberdeen to Sok Kwu Wan<br>17 - Aberdeen to Yung Shue Wan<br>18 - Central to Hung Hom<br>19 - Ma Liu Shui to Tap Mun<br>20 - Ma Liu Shui to Tung Ping Chau<br>21 - Tap Mun to Wong Shek<br>22 - Kwun Tong to Mui Wo<br>23 - North Point to Kwun Tong |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |