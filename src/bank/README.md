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
| Airstar Bank Limited | 天星銀行有限公司 | vab[^1] |

__Others__
| Name (EN) | Name (TC) | Code | Developer Portal |
| --- | --- | --- | --- |
| DBS Bank (Hong Kong) Limited | 星展銀行（香港）有限公司 | dbs | [LINK](https://www.dbs.com/dbsdevelopers/hk/index.html) |
| Standard Chartered Bank (Hong Kong) Limited | 渣打銀行（香港）有限公司 | sc | [LINK](https://axess.sc.com) |
| Livi Bank Limited | 理慧銀行有限公司 | livi[^1] | [LINK](https://developer.livibank.com) |
| Fusion Bank Limited | 富融銀行有限公司 | fusion[^1] | [LINK](https://developer.fusionbank.com) |
| Ant Bank (Hong Kong) Limited | 螞蟻銀行(香港)有限公司 | ant[^1][^2] | [LINK](https://developer.antbank.hk/docs) |
| Ping An OneConnect Bank (Hong Kong) Limited | 平安壹賬通銀行(香港)有限公司 | paob[^1][^3] | [LINK](https://openbankapiportal-vb.paob.com.hk/portal/main.html) |
| WeLab Bank Limited | 匯立銀行有限公司 | welab[^1] | [LINK](https://developers.welab.bank) |
| ZA Bank Limited | 眾安銀行有限公司 | za[^1][^4] | [LINK](https://developer.bank.za.group) |


[^1]: Available since `v1.7.0`
[^2]: Feature currently disabled as I can neither create a developer account nor retrieve the base url of the API. No response for requesting an invitation code since March 2022. Contact me if you can access the developer portal.
[^3]: This API require to sign the request but I'm not eligible to apply for sandbox testing. Function may not work as expected.
[^4]: Feature currently disabled as I can neither create a developer account nor figure out the authentication way of the API. Contact me if you can access the developer portal.

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
hsbc.connect([params])
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

### Environment
> Before `v1.7.0`, this package always use `sandbox` setup. You need to update the package and follow the setup below to enable `production` environment.

By default, if the API provides a sandbox environment, this package would try to access it.

You need to use the correct credential and configuration for authorizing the API.

Use the following code to set current environment to `Production`:
```js
// The following line should be invoked for production only
// and MUST BE placed before `bank.connect` or `bank.init`
bank.setProduction(true);
```

Even though some API won't seperate the production and sandbox environment, it is __RECOMMENDED__ to include the above code for later compatibility.

## Initiation
> __WARNING__: The initiation method below is deprecated since `v1.4.0`. Check [this](#initiation-v140) for latest method.

Most of the banks requires these fields.
| Name | Description | Accepted | Remarks |
| --- | --- | --- | --- |
| id | Client ID | string | May refer to developer or app credential |
| secret | Client Secret | string | May refer to developer or app credential |
| lang | Language of result | `en`\|`tc`\|`sc` | Not every bank requires, some may need to specify in search request. Not all languages are supported. |

```
// Applicable to most banks.
bank.init(id, secret, lang)
```

#### :warning: DBS Initiation :warning:

DBS uses a different way to authorize. You need to use the credentials in [*My Apps*](https://www.dbs.com/developers/#/my-apps) and generate your own `JWT`.

```js
/**
 * @params {string} id          Partner Client Id
 * @params {string} secrect     Partner Client Secret
 * @params {string} user        App Username
 * @params {string} jwt         Your JWT
 */

// use `dbs.connect`
dbs.connect({ id, secret, user, jwt }, lang)
// or `dbs.init` for v1.3 or before
dbs.init(id, secret, user, jwt, lang)
```

If you are __*TESTING ONLY*__ and don't want to worry about the x509 certificate or JWT token, follow these steps to authorize correctly:

1. Go to `Documentation` page and try one of the API.
2. In the `API Playground` page, select the __*Demo App*__
3. Get the `id`(Client ID), `secret`(Client Secret), `app`(App Username) and `jwt`(App JWT token).
4. Start initiation.

The token will be valid for 1 day. You will need to repeat the above steps for a new token.

#### :warning: PAOB Initiation :warning:
PAOB uses a different way to authorize. You need to sign each request using your private key. Visit the [*Official Guide*](https://openbankapiportal-vb.paob.com.hk/portal/main.html#/./guide?id=15) and go to section __`4. SDK usage guide`__ for how to generate the key and use it to sign the request.

```js
/**
 * @params                   {string}   id      App ID
 * @params {(data: string) => string}   sign    Your signing function
 */
// use `pabo.connect`
pabo.connect({ id, sign }, lang)
```

### Initiation v1.4.0+
From `v1.4.0`, use `bank.connect()` instead of `bank.init()`.
```
// For most banks
let credential = {
    id: YOUR_ID,
    secret: YOUR_SECRET
}

// For DBS
let credential = {
    id: YOUR_ID,
    secret: YOUR_SECRET,
    app: YOUR_USERNAME,
    jwt: YOUR_JWT,
}

// For LIVI
let credential = {
    secret: YOUR_SECRET,
}

// For PAOB
let credential = {
    id: YOUR_ID,
    sign: (DATA_TO_SIGN) => {
        // your function to sign the data
        return SIGNED_STRING;
    }
}

bank.connect(credential, lang)
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
| --- | --- |
| `branch` | Branch information |
| `atm` | ATM information |
| `depositBox` | Safe deposit box information |
| `saving`\|`current`\|`timeDeposit`\|`foreignCurrency` | Different types of account |
| `mortgage` | Mortgage information |
| `creditCard` | Credit card information. Some may accept `commercialCard` |
| `fx` | Foreign currency exchange information. Some may accept `fx-{subType}` |
| `insurance` | Insurance information. Some may accept `insurance-{subType}` |
| `investment`\|`security` | Investment/Securities information. Some may accept `{type}-{subType}` |
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

## Useful Links
[HKMA - Stage of 4 Open API Phases](https://www.hkma.gov.hk/chi/key-functions/international-financial-centre/fintech/open-application-programming-interface-api-for-the-banking-sector/phase-approach/)
[HKSTP - Data Studio of Open API for all banks](https://openapi.hkstp.org/banking/zh-hk/provider-list/)
