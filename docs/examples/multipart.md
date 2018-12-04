# Multi-Part Form Submission

```yaml
http:
  request:
    method: 'POST'
    url: 'https://some.host/registration'
    body:
      form:
        # multipart form data
        multipart:
          fields:
            username: foo
            password: bar          
            first_name: Foo
            last_name: Bar      
          
          files:
            avatar: '~/home/user.avatar.png'
  
  response:
    statusCode: '$.ctx.response.statusCode'    
```