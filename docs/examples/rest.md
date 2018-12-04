# REST API Integration Examples

## Get JSON

```yaml
http:
  request:
    url: https://some.host/todos/1
    method: GET      
  
  response:
    body:
      # parse response as JSON string and assigned result to ctx.todos.1 field
      assignTo:
        ctx: '$.todos.1'
        as: 'json'
```

## Submit JSON

```yaml
http:
  request:
    url: https://some.host/todos
    method: POST      
    body:
      # submit JSON payload
      json:      
        userId: 
        title: "Don't forget to send POST request."
        completed: false

  response:
    body:
      assignTo:
        ctx: '$.response'
        as: 'json'
```