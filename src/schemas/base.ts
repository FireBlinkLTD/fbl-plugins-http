import * as Joi from 'joi';
import {FBL_PLUGIN_HTTP_REQUEST_SCHEMA} from './request';
import {FBL_PLUGIN_HTTP_RESPONSE_SCHEMA} from './response';

const FBL_PLUGIN_HTTP_BASE_SCHEMA = Joi.object({
    request: FBL_PLUGIN_HTTP_REQUEST_SCHEMA.required(),
    response: FBL_PLUGIN_HTTP_RESPONSE_SCHEMA,
})
    .required()
    .options({abortEarly: true});

export {FBL_PLUGIN_HTTP_BASE_SCHEMA};