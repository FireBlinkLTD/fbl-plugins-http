import {IPlugin} from "fbl/dist/src/interfaces";
import {
  HTTPRequestActionHandler
} from './src/handlers';
import { RandomUserAgentTemplateUtility } from "./src/templateUtilities/RandomUserAgentTemplateUtility";

const packageJson = require('../package.json');

module.exports = <IPlugin> {
  name: packageJson.name,

  description: `Plugin that helps to make HTTP requests from FBL flow.`,

  tags: packageJson.keywords,

  version: packageJson.version,

  requires: {
    fbl: packageJson.peerDependencies.fbl,
    plugins: {
      //pluginId: '<0.0.1'
    },
    applications: []
  },

  reporters: [],

  actionHandlers: [
    new HTTPRequestActionHandler()
  ],

  templateUtils: [
    new  RandomUserAgentTemplateUtility()
  ]
};
