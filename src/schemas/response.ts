import * as Joi from 'joi';
import {FBL_ASSIGN_TO_SCHEMA, FBL_PUSH_TO_SCHEMA} from 'fbl/dist/src/schemas';

const FBL_PLUGIN_HTTP_RESPONSE_SCHEMA = Joi.object({
    statusCode: {
        assignTo: FBL_ASSIGN_TO_SCHEMA,
        pushTo: FBL_PUSH_TO_SCHEMA
    },

    body: {
        assignTo: FBL_ASSIGN_TO_SCHEMA,
        pushTo: FBL_PUSH_TO_SCHEMA,
        saveTo: Joi.string()
    }
});

export {FBL_PLUGIN_HTTP_RESPONSE_SCHEMA};
