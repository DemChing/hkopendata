## Intro
Banks in Hong Kong have provided API to access their data. They follow the timeline listed in [HKMA](https://www.hkma.gov.hk/chi/key-functions/international-financial-centre/fintech/open-application-programming-interface-api-for-the-banking-sector/phase-approach/) and publish relevant API.

:warning: __WARNING__ :warning:
All methods in this section are tested in sandbox environment only. Some critical error exists and may ruin the function (eg. typo of field names, actual data type not match the documentation).

Since only sandbox test data can be accessed, all development in this section will not try to fix any error. Thus you should expect a smooth development under sandbox environment but __some BUGS__ in production.

Please kindly create issues to report bugs.

:warning: __Notice__ :warning:
Some banks already published API for public to apply their services. After digging with their API, I gave up developing those API as it is way too complicated for me to handle those request.

## Supported Banks
The API of different banks under a group (except Others) is very similar to each other (not 100% same). Codes should be able tp reuse in most cases.

__HSBC Group__
| Name (EN) | Name (TC) | Code | Developer Portal |
| --- | --- | --- | --- |
| The Hongkong and Shanghai Banking Corporation Limited | 香港上海滙豐銀行有限公司 | hsbc | [LINK](https://developer.hsbc.com.hk) |
| Hang Seng Bank Limited | 恒生銀行有限公司 | hs | [LINK](https://developer.hangseng.com) |

__BOCHK__
| Name (EN) | Name (TC) | Code | Developer Portal |
| --- | --- | --- | --- |
| Bank of China（Hong Kong）Limited | 中國銀行(香港)有限公司 | boc | [LINK](https://api.bochk.com) |
| Chiyu Banking Corporation Limited | 集友銀行有限公司 | chiyu | [LINK](https://apidev.chiyubank.com) |
| Nanyang Commercial Bank, Limited | 南洋商業銀行有限公司 | ncb | [LINK](https://developer.ncb.com.hk) |


__JETCO Related__
:warning: All banks listed below use the same API provider. :warning:

Developer Portal [LINK](https://sandboxportal.apix.com.hk/jetco/sb)
| Name (EN) | Name (TC) | Code |
| --- | --- | --- |
| Bank of Communications (Hong Kong) Limited | 交通銀行（香港）有限公司 | bch |
| The Bank of East Asia Limited | 東亞銀行有限公司 | bea |
| China Construction Bank (Asia) Corporation Limited | 中國建設銀行（亞洲）股份有限公司 | cal |
| China CITIC Bank International Limited | 中信銀行（國際）有限公司 | cbi |
| Chong Hing Bank Limited | 創興銀行有限公司 | chb |
| Citibank (Hong Kong) Limited | 花旗銀行（香港）有限公司 | ctn |
| Dah Sing Banking Group Limited | 大新銀行集團有限公司 | dsb |
| Fubon Bank (Hong Kong) Limited | 富邦銀行（香港）有限公司 | fbb |
| Industrial and Commercial Bank of China（Asia）Limited | 中國工商銀行（亞洲）有限公司 | icb |
| Public Bank (Hong Kong) Limited | 大眾銀行（香港）有限公司 | pbl |
| Shanghai Commercial Bank Limited | 上海商業銀行有限公司 | scb |
| OCBC Wing Hang Bank Limited | 華僑永亨銀行有限公司 | whb |
| CMB Wing Lung Bank Limited | 招商永隆銀行有限公司 | wlb |

__Others__
| Name (EN) | Name (TC) | Code | Developer Portal |
| --- | --- | --- | --- |
| DBS Bank (Hong Kong) Limited | 星展銀行（香港）有限公司 | dbs | [LINK](https://www.dbs.com/dbsdevelopers/hk/index.html) |
| Standard Chartered Bank (Hong Kong) Limited | 渣打銀行（香港）有限公司 | sc | [LINK](https://axess.sc.com) |

## Usage
First, include the relevant module.
```
// require HSBC only
const hsbc = require("hkopendata").bank.hsbc;

// or require multiple module
const { hsbc, hs } = require("hkopendata").bank;
```

Next, initiate with credentials and do the searching. All the methods return a promise. You should handle the result or error properly.
```
hsbc.init([params])
    .then(() => {
        // Initiate Success
        return hsbc.search([params])
    })
    .then(result => {
        // Process the result
    })
    .catch(error => {
        // Initiate error / Search error
    })
```

## Initiation
Most of the banks requires these fields.
| Name | Description | Accepted | Remarks |
| --- | --- | --- |
| id | Client ID | string | May refer to developer or app credential |
| secret | Client Secret | string | May refer to developer or app credential |
| lang | Language of result | `en`|`tc`|`sc` | Not every bank requires, some may need to specify in search request. Not all languages are supported. |

```
// Applicable to most banks.
bank.init(id, secret, lang)
```

:warning: DBS Initiation :warning:
DBS uses a different way to authorize. Follow these steps to authorize correctly:

1. Go to `Documentation` page and try one of the API.
2. In the `API Playground` page, select the __*Demo App*__
3. Get the `ID`, `Secret`, App `Username` and `JWT Token`.
4. Start initiation.

```
// Use the credentials obtained above to initiate
dbs.init(id, secret, user, jwt, lang)
```

## Search
All banks use the same way to search for data.
```
// Remember it returns a promise
bank.search(searchType[, params])
```

If API accept extra parameters or headers, put those data to `params`.
```
bank.search(searchType, {
    headers: {
        fakeHeader: "value"
    },
    data: {
        fakeData: "value"
    }
})
```

### Search Types
Different banks support different search type. Here list the general types:
| Type | Description |
| `branch` | Branch information |
| `atm` | ATM information |
| `depositBox` | Safe deposit box information |
| `saving`|`current`|`timeDeposit`|`foreignCurrency` | Different types of account |
| `mortgage` | Mortgage information |
| `creditCard` | Credit card information. Some may accept `commercialCard` |
| `fx` | Foreign currency exchange information. Some may accept `fx-{subType}` |
| `insurance` | Insurance information. Some may accept `insurance-{subType}` |
| `investment`|`security` | Investment/Securities information. Some may accept `{type}-{subType}` |
| `loan` | Loan information. Some may accept `(un)securedLoan` and `(un)securedLend`. Some may accept `loan-{subType}`. |

For general information, you can check supported type of [HSBC Group](#hsbc-group-search), [BOCHK](#bochk-search) and [JETCO](#jetco-search) below.

For the actual search type and sub type, always refer to the official documentation instead of this page. Create issues if a type should be supported but error `Invalid search type` occurs.

### HSBC Group Search
Banks under HSBC Group does not support `investment`, `insurance` and `security` searching.

`loan` is replaced with `securedLoan`, `securedLend`, `unsecuredLoan` and `unsecuredLend`.

### BOCHK Search
Banks under BOCHK does not support `atm` searching.

`investment`, `security`, `insurance`, `loan` and `fx` are replaced with `{type}-{subType}`. Check the endpoint URL (Format: `/{type}/product/{subType}/v1`) in official documetation to get the accepted sub types.

### JETCO Search
Banks under JETCO does not support `security` searching.

`loan` is replaced with `securedLoan`, and `unsecuredLoan`.
`investment` and `insurance` are replaced with `{type}-{subType}`. Check the endpoint URL (Format: `/{type}/v1/{subType}`) in official documetation to get the accepted sub types.

## Result
Data retrieved will change the field names so that the specific field name among different banks means the same thing. Then, it would try to unify the format and structure to make the final result as similar as possible among all banks.

:warning: __Warning__ :warning:
Same field name may refer to different thing among different banks due to:
1. Insufficient detail in documentation to identify what the field is
2. Mix up with very similar terms (in my point of view)

To check if the field actually refer to what you expected, try running `utils.ToLocale()` in both `en` and `tc` language.
```
bank.search(type)
    .then(result => {
        utils.ToLocale(result, lang, "bank")
    })
    .catch(() => {})
```