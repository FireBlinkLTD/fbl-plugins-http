import * as Joi from 'joi';

const FBL_PLUGIN_HTTP_REQUEST_SCHEMA = Joi.object()
    .keys({
        method: Joi.string()
            .valid('DELETE', 'GET', 'PATCH', 'POST', 'PUT')            
            .required(),

        url: Joi.string()
            .regex(/http[s]?:\/\//)
            .required(),

        query: Joi.object()
            .pattern(
                /.+/,
                Joi.alternatives(
                    Joi.string(),
                    Joi.array().items(Joi.string())
                )
            ),

        headers: Joi.object()
            .pattern(
                /.+/,
                Joi.alternatives(
                    Joi.string(), 
                    Joi.number(),  
                    Joi.boolean()                  
                )
            ),
        body: Joi.object()
            .keys({
                form: Joi.object()
                    .keys({
                        fields: Joi.object()
                            .pattern(
                                /.+/, 
                                Joi.alternatives(
                                    Joi.string(), 
                                    Joi.number(),
                                    Joi.array().items(Joi.string()).min(1)
                                )
                            ),
                        files: Joi.object()
                            .pattern(
                                /.+/, 
                                Joi.string().min(1)
                            )                        
                    }),
                
                json: Joi.any(),
                
                file: Joi.alternatives(
                    Joi.string().min(1),
                    Joi.object()
                        .keys({
                            path: Joi.string().min(1).required(),
                            template: Joi.boolean()
                        })
                )
            })
            .min(1)
            .max(1),

        timeout: Joi.number().min(0)
    })
    .options({
        allowUnknown: false,
        abortEarly: true
    });

export {FBL_PLUGIN_HTTP_REQUEST_SCHEMA};
