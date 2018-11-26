import * as Joi from 'joi';
import {FBL_ASSIGN_TO_SCHEMA, FBL_PUSH_TO_SCHEMA} from 'fbl/dist/src/schemas';

const FBL_PLUGIN_HTTP_RESPONSE_SCHEMA = Joi.object({
    statusCode: Joi.object({
        assignTo: FBL_ASSIGN_TO_SCHEMA,
        pushTo: FBL_PUSH_TO_SCHEMA
    })
        .options({
            allowUnknown: false
        })
        .or('assignTo', 'pushTo'),

    headers:  Joi.object({
        assignTo: FBL_ASSIGN_TO_SCHEMA,
        pushTo: FBL_PUSH_TO_SCHEMA
    })
        .options({
            allowUnknown: false
        })
        .or('assignTo', 'pushTo'),

    body: Joi.object({
        assignTo: FBL_ASSIGN_TO_SCHEMA,
        pushTo: FBL_PUSH_TO_SCHEMA,
        saveTo: Joi.string()
    })
        .options({
            allowUnknown: false
        })
        .or('assignTo', 'pushTo', 'saveTo')
});

export {FBL_PLUGIN_HTTP_RESPONSE_SCHEMA};
