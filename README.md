# FBL Plugins: HTTP Request

Make REST calls. Submit forms, upload and download files through HTTP(s) protocol. All these and a little bit more you can do with HTTP plugin for [fbl](https://fbl.fireblink.com).

[![CircleCI](https://circleci.com/gh/FireBlinkLTD/fbl-plugins-http.svg?style=svg)](https://circleci.com/gh/FireBlinkLTD/fbl-plugins-http) [![Greenkeeper badge](https://badges.greenkeeper.io/FireBlinkLTD/fbl-plugins-http.svg)](https://greenkeeper.io/)

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
    "@fbl-plugins/http": "1.0.1",
    "fbl": "1.3.0"
  }
}
```

Then you can install dependencies as any other node module `yarn install` depending on the package manager of your choice.

After that you can use `yarn fbl <args>` to execute your flow or even register a custom script inside "scripts".

### Global installation

`npm i -g @fbl-plugins/http`

### Register plugin to be accessible by fbl

- via cli: `fbl -p @fbl-plugins/http <args>`
- via flow:

```yaml
requires:
  plugins:
    '@fbl-plugins/http': '>=0.1.0'
    
pipeline:
  # your flow goes here
```

## Documentation

Read more [here](docs/README.md).
