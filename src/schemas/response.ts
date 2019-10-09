import * as Joi from 'joi';
import {
    FBL_ASSIGN_TO_SCHEMA,
    FBL_PUSH_TO_SCHEMA,
    FBL_ASSIGN_TO_OBJECT_SCHEMA,
    FBL_ASSIGN_TO_STRING_SCHEMA,
    FBL_PUSH_TO_STRING_SCHEMA,
    FBL_PUSH_TO_OBJECT_SCHEMA,
} from 'fbl/dist/src/schemas';

const FBL_PLUGIN_HTTP_RESPONSE_SCHEMA = Joi.object()
    .keys({
        statusCode: Joi.object()
            .keys({
                successful: Joi.array().items(
                    Joi.number()
                        .min(100)
                        .max(599)
                        .integer(),
                ),
                assignTo: FBL_ASSIGN_TO_SCHEMA,
                pushTo: FBL_PUSH_TO_SCHEMA,
            })
            .min(1),

        headers: Joi.object()
            .keys({
                assignTo: FBL_ASSIGN_TO_SCHEMA,
                pushTo: FBL_PUSH_TO_SCHEMA,
            })
            .min(1),

        body: Joi.object().keys({
            assignTo: Joi.alternatives(
                FBL_ASSIGN_TO_STRING_SCHEMA,
                FBL_ASSIGN_TO_OBJECT_SCHEMA.keys({
                    as: Joi.string().allow('base64', 'hex', 'utf8', 'json'),
                }),
            ),
            pushTo: Joi.alternatives(
                FBL_PUSH_TO_STRING_SCHEMA,
                FBL_PUSH_TO_OBJECT_SCHEMA.keys({
                    as: Joi.string().allow('base64', 'hex', 'utf8', 'json'),
                }),
            ),
            saveTo: Joi.string().min(1),
        }),
    })
    .options({
        allowUnknown: false,
        abortEarly: true,
    });

export { FBL_PLUGIN_HTTP_RESPONSE_SCHEMA };
