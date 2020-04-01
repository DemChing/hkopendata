## Intro
This section will collect API published by organizations that are neither government department or banks.
Currently, only API from Hongkong Post (香港郵政) is available.

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