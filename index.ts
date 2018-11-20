import {IPlugin} from "fbl/dist/src/interfaces";
import {
    DeleteJSONActionHandler,
    GetJSONActionHandler,
    PatchJSONActionHandler,
    PostJSONActionHandler,
    PutJSONActionHandler
} from './src/handlers/json';

const packageJson = require('../package.json');

module.exports = <IPlugin> {
  name: packageJson.name,

  description: `Plugin that helps to make HTTP requests from FBL flow.`,

  tags: packageJson.keywords,

  version: packageJson.version,

  requires: {
    fbl: `>=${packageJson.dependencies.fbl}`,
    plugins: {
      //pluginId: '<0.0.1'
    },
    applications: []
  },

  reporters: [],

  actionHandlers: [
      new DeleteJSONActionHandler(),
      new GetJSONActionHandler(),
      new PatchJSONActionHandler(),
      new PostJSONActionHandler(),
      new PutJSONActionHandler(),
  ],

  templateUtils: []
};
