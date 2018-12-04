# URLEncoded Form Submission

```yaml
http:
  request:
    method: 'POST'
    url: 'https://some.host/registration'
    body:
      form:
        # urlencoded form data
        urlencoded:
          username: foo
          password: bar          
          first_name: Foo
          last_name: Bar      
  
  response:
    statusCode: '$.ctx.response.statusCode'    
```