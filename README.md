# FBL Plugins: HTTP Request

[![CircleCI](https://circleci.com/gh/FireBlinkLTD/fbl-plugins-http.svg?style=svg)](https://circleci.com/gh/FireBlinkLTD/fbl-plugins-http) [![Greenkeeper badge](https://badges.greenkeeper.io/FireBlinkLTD/fbl-plugins-http.svg)](https://greenkeeper.io/)

Plugins allows to make all kinds of http requests and can be used to download/upload files, submit forms or to integrate with REST services.

## Integration

There are multiple ways how plugin can be integrated into your flow.

### package.json

This is the most recommended way. Create `package.json` next to your flow file with following content:

```json
{
  "name": "flow-name",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "fbl": "fbl"    
  },
  "license": "UNLICENSED",
  "dependencies": {
    "@fbl-plguins/http": "0.1.0",
    "fbl": "1.1.0"
  }
}
```

Then you can install dependencies as any other node module `yarn install` depending on the package manager of your choice.

After that you can use `yarn fbl <args>` to execute your flow or even register a custom script inside "scripts".

### Global installation

`npm i -g @fbl-plguins/http`

### Register plugin to be accessible by fbl

- via cli: `fbl -p @fbl-plguins/http <args>`
- via flow:

```yaml
requires:
  plugins:
    '@fbl-plguins/http': '>=0.1.0'
    
pipeline:
  # your flow goes here
```

## Documentation

Read more [here](docs/README.md).
