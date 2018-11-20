# JSON Request Action Handlers

Various action handlers that allow to make DELETE, GET, PATCH, POST, PUT requests with JSON payload and expect server 
to return JSON response.

**ID Pattern:** `com.fireblink.fbl.plugins.http.<action>.json` 

**Aliases:**
- `fbl.plugins.http.<action>.json`
- `plugins.http.<action>.json`
- `http.<action>.json`
- `<action>.json`

Where `<action>` can be one of the following:
- delete
- get
- patch
- post
- put

E.g: com.fireblink.fbl.plugins.http.**delete**.json

**Example:**

```yaml
get.json:
    # [required] HTTP Request parameters
    request:
      # [required] url to make the request to    
      url: http://fireblink.com/endpoint
      # [optional] query parameters either key-value pair or array of arrays. 
      # URLSearchParams are used to wrap the value - https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams  
      query: 
        test: yes
      # [optional] key-value pairs of additional HTTP request headers
      headers:
        authorization: Bearer XXXXXXXX
      # [optional] request body
      body:   
        # [optional] inline body value
        # Note: either "inline" or "file" can be provided, but not both
        inline: 
          some_field: 1
          
        # [optional] file that hosts JSON payload to be send
        # Note: either "inline" or "file" can be provided, but not both
        file: /tmp/body.json
      
      # [optional] request timeout in seconds. Default value - 1 minute.
      timeout: 600
      
    # [optional] HTTP Response parameters
    response:
      # [optional] HTTP Response status code parameters
      statusCode: 
        assignTo:
          # [optional] "ctx" variable name to assign status code to ("test")
          ctx: '$.test'
          # [optional] "secrets" variable name to assign status code  to ("test")
          secrets: '$.test'
          # [optional] "parameters" variable name to assign status code to ("test")
          parameters: '$.test'
        pushTo:
          # [optional] "ctx" variable name to push status code to ("test")
          ctx: '$.test'
          # [optional] "secrets" variable name to push status code to ("test")
          secrets: '$.test'
          # [optional] "parameters" variable name to push status code to ("test")
          parameters: '$.test'         
        
      # [optional] HTTP Response Body parameters
      body:
        assignTo:
          # [optional] "ctx" variable name to assign response body to ("test")
          ctx: '$.test'
          # [optional] "secrets" variable name to assign response body  to ("test")
          secrets: '$.test'
          # [optional] "parameters" variable name to assign response body to ("test")
          parameters: '$.test'
          # [optional] override object by given path instead of assigning values to
          override: true
        
        pushTo:
          # [optional] "ctx" variable name to push response body to ("test")
          ctx: '$.test'
          # [optional] "secrets" variable name to push response body to ("test")
          secrets: '$.test'
          # [optional] "parameters" variable name to push response body to ("test")
          parameters: '$.test'   
          # [optional] if response body is array push elements to given paths, but not array itself        
          children: true
          # [optional] if there are some elements in array at given paths - they will be removed before assigning new value.
          override: true  
        
        # [optional] path to file to save the response body to
        saveTo: /tmp/response.json 
              
```
