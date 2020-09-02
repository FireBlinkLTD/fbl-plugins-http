import {
    ActionHandler,
    ActionProcessor,
    ActionSnapshot,
    IActionHandlerMetadata,
    IDelegatedParameters,
    IContext,
    FSUtil,
} from 'fbl';

import * as Joi from 'joi';
import Container from 'typedi';

import { FBL_PLUGIN_HTTP_REQUEST_SCHEMA, FBL_PLUGIN_HTTP_RESPONSE_SCHEMA } from '../schemas';
import { HTTPRequestService } from '../services';

export class HTTPRequestActionProcessor extends ActionProcessor {
    private static schema = Joi.object()
        .keys({
            request: FBL_PLUGIN_HTTP_REQUEST_SCHEMA.required(),
            response: FBL_PLUGIN_HTTP_RESPONSE_SCHEMA,
        })
        .required()
        .options({
            abortEarly: true,
            allowUnknown: false,
        });

    /**
     * @inheritdoc
     */
    getValidationSchema(): Joi.Schema {
        return HTTPRequestActionProcessor.schema;
    }

    /**
     * Make sure file exists at given path
     * @param path
     */
    private async validateFileExistance(path: string): Promise<void> {
        path = FSUtil.getAbsolutePath(path, this.snapshot.wd);
        const exists = await FSUtil.exists(path);

        if (!exists) {
            throw new Error(`Unable to locate file at path: ${path}`);
        }
    }

    /**
     * @inheritdoc
     */
    async validate(): Promise<void> {
        await super.validate();

        if (this.options.request.body) {
            if (this.options.request.body.file) {
                if (typeof this.options.request.body.file === 'string') {
                    await this.validateFileExistance(this.options.request.body.file);
                } else {
                    await this.validateFileExistance(this.options.request.body.file.path);
                }
            }

            if (
                this.options.request.body.form &&
                this.options.request.body.form.multipart &&
                this.options.request.body.form.multipart.files &&
                Object.keys(this.options.request.body.form.multipart.files).length
            ) {
                for (const fieldName of Object.keys(this.options.request.body.form.multipart.files)) {
                    await this.validateFileExistance(this.options.request.body.form.multipart.files[fieldName]);
                }
            }
        }
    }

    /**
     * @inheritdoc
     */
    async execute(): Promise<void> {
        const httpRequestService = Container.get(HTTPRequestService);

        // make request
        try {
            await httpRequestService.makeRequest(
                this.context,
                this.snapshot,
                this.parameters,
                this.options.request,
                this.options.response,
            );
        } catch (e) {
            throw e;
        }
    }
}

export class HTTPRequestActionHandler extends ActionHandler {
    private static metadata = <IActionHandlerMetadata>{
        id: 'com.fireblink.fbl.plugins.http.request',
        aliases: ['fbl.plugins.http.request', 'http.request', 'http'],
    };

    /**
     * @inheritdoc
     */
    getMetadata(): IActionHandlerMetadata {
        return HTTPRequestActionHandler.metadata;
    }

    /**
     * @inheritdoc
     */
    getProcessor(
        options: any,
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
    ): ActionProcessor {
        return new HTTPRequestActionProcessor(options, context, snapshot, parameters);
    }
}
