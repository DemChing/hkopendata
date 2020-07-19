## Middleware
This is a simple middleware to construct a success/fail response (implemented in `v1.4.0`). It is optional and does not add any new feature at this moment.

### Information
Without this middleware, processed data or error is returned directly.
```
request()
    .then(result => {
        // `result` contains the processed data
        result = {
            key1: value1,
            key2: value2,
            ...
        }
    })
    .catch(error => {
        // `error` could be a string message, error json return by endpoint or error throw during the process
        error = "Some error"
        error = {
            error: error code
            message: error message
        }
        ...
    })
```

With the middleware, data and error are constructed to a json. It will also try to get the error message if error is spotted.
```
request()
    .then(response => {
        // `response.error` should be false
        // `response.data` contains the processed data
        response = {
            error: false,
            data: {
                key1: value1,
                key2: value2,
                ...
            }
        }
    })
    .catch(response => {
        // `response.error` should be true
        // `response.message` contains the error message found or default message if failed to retrieve or no message exist
        response = {
            error: true,
            message: error message
        }
    })
```

### Usage
It is completely the same as without middleware except require a different variable.
```
// If you previously write this:
const aahk = require("hkopendata").gov.aahk;
const { gov } = require("hkopendata");

// You can modify it to:
const aahk = require("hkopendata").middleware.gov.aahk;
const { gov } = require("hkopendata").middleware;
```

Calling function is the __SAME__ so you don't need to change it. But remember to update how you handle the data.