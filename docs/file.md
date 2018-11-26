# File Download/Upload Request Action Handlers

Simple actions to download / upload files.

## Download

**ID:** com.fireblink.fbl.plugins.http.download

**Aliases:**
- fbl.plugins.http.download
- plugins.http.download
- http.download
- download

**Example:**

```yaml
download:  
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

    # [optional] request timeout in seconds. Default value - 1 minute.
    timeout: 600
  
  # [required] HTTP Response parameters
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
    
    # [required] HTTP Response Body parameters
    # Note: at least one of "assignTo", "pushTo" and "saveTo" fields is required
    body:
      assignTo:
        # [required] value encoding - utf8, base64 or hex
        encoding: 'utf8'
        # [optional] "ctx" variable name to assign response body to ("test")
        ctx: '$.test'
        # [optional] "secrets" variable name to assign response body  to ("test")
        secrets: '$.test'
        # [optional] "parameters" variable name to assign response body to ("test")
        parameters: '$.test'
        # [optional] override object by given path instead of assigning values to
        override: true
    
      pushTo:
        # [required] value encoding - utf8, base64 or hex
        encoding: 'utf8'
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