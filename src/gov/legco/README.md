## Open Data Protocol
All functions in this section can be accessed using Web API standard of `OData`. You can pass your own parameters if the function does not meet your requirement.

Here list some parameters that can be used. You could always check the user manual from the official website.

| Field | Params used in function | Type | Description | Remarks |
| --- | --- | --- | --- | --- |
| `$top` | `limit` | number | Return N entries at most |  |
| `$skip` | `offset` | number | Return entries with index larger than N |  |
| `$orderby` | `sortby`, `sortorder` | string | Arrange entries in specific order | `$orderby` should contains column name and order type together.<br>`sortby` should contains column name while `sortorder` contains order type. |
| `$filter` | `filter` | string | Filter entries with condition | `$filter` should be a string contains all conditions.<br>`filter` is a key-value object. Limited operation can be done using `filter` |
| `$expand` | `expand` | string | Include related resources by name | `$expand` should be a string contains all name of resource.<br>`expand` is a key-value object. Limited operation can be done using `expand` |

### Example
To get data with `col_name` contains `MY NAME`, include another resource `Resource`, sort it with key `col_name2` in descending order and return the 31st to 40th entries only.
```
// Use official key-values
let params = {
    $filter: "substringof('MY NAME',col_name) eq true",
    $orderby: "col_name2 desc",
    $expand: "Resource",
    $top: 10,
    $skip: 30,
}

// Use function parameters
let params = {
    filter: {
        "col_name": "MY NAME"
    },
    sortby: "col_name2",
    sortorder: "desc",
    expand: {
        "Resource": true,
    },
    limit: 10,
    offset: 30,
}
```

Each function supports different keys in `filter` and `expand`. Please read the instruction carefully or use `$filter` and `$expand` directly.

Please keep in mind that `filter` is useless if you specify it together with `$filter`. Same thing applies to `expand` and `$expand` too.