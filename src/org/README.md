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
| `params.type` | true | number `[0-2]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Fare |
| `params.route` | false | string |  | Route | Route __NAME__. Required when `params.type` equals `1` or `2` |

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
| `params.type` | true | number `[0-2]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of Route<br>2 - Fares |
| `params.route` | false | string |  | Route | Route __NAME__. Required when `params.type` equals `1` |
| `params.from` | false | string |  | Origin Stop | Stop __ID__. Required when `params.type` equals `2` |
| `params.to` | false | string |  | Destination Stop | Stop __ID__. Required when `params.type` equals `2` |
| `params.dir` | false | number `[0-1]` | 0 | Direction | 0 - Down<br>1 - UP<br>2 - Down (branch)<br>3 - Up (branch)<br><br>Accepted when `params.type` equals `0` or `1` |

- `searchTram(params)` Rail information from Tramways (電車)

__Parameters__
| Name | Required | Accepted | Default | Description | Remarks |
| --- | --- | --- | --- | --- | --- |
| `params.type` | true | number `[0-1]` | 0 | Type of information | 0 - Route Info<br>1 - Stops of All Route |
| `params.route` | false | string |  | Route | Route __NAME__. Accepted when `params.type` equals `0` |
| `params.stop` | false | string |  | Stop | Stop __CODE__. Accepted when `params.type` equals `1` |
| `params.dir` | false | number `[0-1]` | 0 | Direction | 0 - Eastbound<br>1 - Westbound<br><br>Accepted when `params.type` equals `1` |
| `params.lang` | false | string (`en`/`tc`/`sc`) | en | Language of the result |  |
