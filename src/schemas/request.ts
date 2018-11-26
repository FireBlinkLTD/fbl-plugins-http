import * as Joi from 'joi';

const FBL_PLUGIN_HTTP_REQUEST_SCHEMA = Joi.object({
    url: Joi.string().regex(/http[s]?:\/\//).required(),
    query: Joi.alternatives(Joi.object(), Joi.array()),

    headers: Joi.object().pattern(
        /.+/,
        Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean())
    ),

    body: Joi.object({
        inline: Joi.alternatives(Joi.string(), Joi.object(), Joi.number(), Joi.array()),
        file: Joi.string(),
        form: Joi.boolean()
    })
        .options({
            allowUnknown: false,
            abortEarly: true
        }),

    timeout: Joi.number()
}).options({
    allowUnknown: false,
    abortEarly: true
});

export {FBL_PLUGIN_HTTP_REQUEST_SCHEMA};
