import { ActionHandler, ActionSnapshot } from 'fbl/dist/src/models';
import * as Joi from 'joi';
import { FBL_PLUGIN_HTTP_REQUEST_SCHEMA, FBL_PLUGIN_HTTP_RESPONSE_SCHEMA } from '../schemas';
import { IActionHandlerMetadata, IDelegatedParameters, IContext } from 'fbl/dist/src/interfaces';
import { FSUtil } from 'fbl/dist/src/utils';
import Container from 'typedi';
import { HTTPRequestService } from '../services';
import { request } from 'http';
import { RequestUtil } from '../utils/RequestUtil';

export class HTTPRequestActionHandler extends ActionHandler {
    private static metadata = <IActionHandlerMetadata> {
        id: 'com.fireblink.fbl.plugins.http.request',
        aliases: [
            'fbl.plugins.http.request',
            'http.request',
        ]
    };

    private static schema = Joi.object()
        .keys({
            request: FBL_PLUGIN_HTTP_REQUEST_SCHEMA.required(),
            response: FBL_PLUGIN_HTTP_RESPONSE_SCHEMA
        })
        .required()
        .options({
            abortEarly: true,
            allowUnknown: false
        });

    /**
     * @inheritdoc
     */
    getMetadata(): IActionHandlerMetadata {
        return HTTPRequestActionHandler.metadata;
    }

    /**
     * @inheritdoc
     */
    getValidationSchema(): Joi.SchemaLike {
        return HTTPRequestActionHandler.schema;
    }

    /**
     * Make sure file exists at given path
     * @param path
     * @param wd 
     */
    private async validateFileExistance(path: string, wd: string): Promise<void> {
        path = FSUtil.getAbsolutePath(path, wd);
        const exists = await FSUtil.exists(path);

        if (!exists) {
            throw new Error(`Unable to locate file at path: ${path}`);
        }
    }

    /**
     * @inheritdoc    
     */
    async validate(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        await super.validate(options, context, snapshot, parameters);

        if (options.request.body) {
            if (options.request.body.file) {
                if (typeof options.request.body.file === 'string') {
                    await this.validateFileExistance(options.request.body.file, snapshot.wd);
                } else {
                    await this.validateFileExistance(options.request.body.file.path, snapshot.wd);
                }
            }

            if (options.request.body.form && options.request.body.form.files && Object.keys(options.request.body.form.files).length) {
                if (options.request.headers) {
                    const contentType = RequestUtil.getHeader(options.request.headers, 'content-type');
                    if (contentType && contentType.toString().toLowerCase() === 'application/x-www-form-urlencoded') {
                        throw new Error('Unable to use "x-www-form-urlencoded" with files.');
                    }
                }
                for (const fieldName of Object.keys(options.request.body.form.files)) {
                    await this.validateFileExistance(options.request.body.form.files[fieldName], snapshot.wd);                    
                }
            }
        }
    }

    /**
     * @inheritdoc
     */
    async execute(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        const httpRequestService = Container.get(HTTPRequestService);    
        
        // make request
        await httpRequestService.makeRequest(
            context,
            snapshot,
            parameters,
            options.request, 
            options.response
        );
    }
}
