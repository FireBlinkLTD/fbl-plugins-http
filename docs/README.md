# HTTP Request Action Handler

Make any kind of http/https actions.

**ID:** `com.fireblink.fbl.plugins.http.request`
        
**Aliases:** 
* `fbl.plugins.http.request`
* `http.request`
* `http`        

```yaml
http:    
    # [required] Request configuration
    request:
        # [required] HTTP method
        # Possible values: DELETE, GET, PATCH, POST, PUT        
        method: 'GET'
        
        # [required] HTTP or HTTPS url to send the request to
        url: https://api.fireblink.com

        # [optional] additional query search paramters to include in the URL
        query:
            sort: ASC
        
        # [optional] additional headers to send with request
        headers:
            'Authorization': 'Bearer XXXXXXXXXXXXXX'
        
        # [optional] body content to send with request
        body:
            # [optional] request body is representing either urlencoded or multipart form            
            form: 
                # [optional] key/value pairs of fields to present form data
                urlencoded: 
                    key1: value
                    key2: 22222
                    key3:   
                        - value1
                        - value2
                
                # [optional] multipart form data
                # Note: at least one field or file is required upon using multipart form
                multipart:
                    # [optional] key/value pairs of fields to present form data
                    fields:
                        key1: value
                        key2: 22222
                        key3:   
                            - value1
                            - value2
                    
                    # [optional] key/value pairs of file names and paths to actual files                    
                    files:
                        'a/test.txt': '/tmp/test.txt'

            # [optional] any data that can be converted into JSON string and send as a request body
            json:
                test: 'yes'
                arr: 
                    - 1
                    - 2 

            # [optional] use file as a request body
            file: /path/to/file
            
            # alternative file upload syntax:
            file: 
                path: /path/to/file
                # if marked as template - file will be treated as EJS template and both
                # global and local template resolvers will be applied to file content (in memory)                
                template: true

        # [optional] custom request timeout in seconds
        # default value: 60
        timeout: 300
    
    # [optional] Response handling configuration
    response:
        # [optional] store http response status code
        statusCode:
            pushTo: # follows common push logic practicies https://fbl.fireblink.com/plugins/common#push-to
            assignTo: # follows common assign logic practicies https://fbl.fireblink.com/plugins/common#assign-to 
        
        # [optional] store http response headers
        headers:
            pushTo: # follows common push logic practicies https://fbl.fireblink.com/plugins/common#push-to 
            assignTo: # follows common assign logic practicies https://fbl.fireblink.com/plugins/common#assign-to 

        # [optional] store http response body
        body: 
            # [optional] Push response body into context field(s)
            pushTo: # follows common push logic practicies https://fbl.fireblink.com/plugins/common#push-to 
                # [optional] additional field that identifies in which format store response body
                # Default value: base64
                # Possible values:
                # - json - parse response body from JSON string
                # - base64 - convert response body into base64 encoded string
                # - hex - convert response body into hex encoded string
                # - utf8 - convert response body into UTF-8 encoded string
                as: json

            # [optional] Assign response body into context field(s)
            assignTo: # follows common assign logic practicies https://fbl.fireblink.com/plugins/common#assign-to 
                # [optional] additional field that identifies in which format store response body
                # Default and possible values are the same as ones above in `pushTo.as` field description.
                as: json

            # [optional] save response body into file
            saveTo: /tmp/reponse.body.bin
```

## Examples

* [JSON Rest API](examples/rest.md)
* [URLEncoded Form Submission](examples/urlencoded.md)
* [Multipart Form Submission](examples/multipart.md)