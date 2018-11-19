import {ActionHandler, ActionSnapshot} from 'fbl/dist/src/models';
import * as Joi from 'joi';
import {FBL_PLUGIN_HTTP_BASE_SCHEMA} from '../../schemas';
import {GotFn, GotJSONOptions} from 'got';
import {IContext, IDelegatedParameters} from 'fbl/dist/src/interfaces';
import {ContextUtil, FSUtil} from 'fbl/dist/src/utils';
import {dirname} from 'path';
import {promisify} from 'util';
import {writeFile} from 'fs';
import {URLSearchParams} from 'url';

export abstract class BaseJsonActionHandler extends ActionHandler {
    getValidationSchema(): Joi.SchemaLike | null {
        return FBL_PLUGIN_HTTP_BASE_SCHEMA;
    }

    abstract gotFn(): GotFn;

    async validate(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        await super.validate(options, context, snapshot, parameters);

        if (options.request.body) {
            if (options.request.body.file) {
                const exists = await FSUtil.exists(
                    FSUtil.getAbsolutePath(options.request.body.file, snapshot.wd)
                );

                if (!exists) {
                    throw new Error(`Unable to locate body payload file at path: ${options.request.body.file}`);
                }
            }

            if (options.request.body.upload) {
                throw new Error('request.body.upload parameter can not be true for JSON requests');
            }
        }
    }

    async execute(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        const fn = this.gotFn();

        let requestOptions = <GotJSONOptions> {
            headers: options.request.headers || {},
            timeout: options.request.timeout || 60,
            json: true
        };

        if (options.request.query) {
            requestOptions.query = new URLSearchParams(options.request.query);
        }

        if (options.request.body) {
            if (options.request.body.inline) {
                requestOptions.body = options.request.body.inline;
            }

            if (options.request.body.file) {
                requestOptions.body = await FSUtil.readYamlFromFile(
                    FSUtil.getAbsolutePath(options.request.body.file, snapshot.wd)
                );
            }
        }

        const response = await fn(options.request.url, requestOptions);

        if (options.response) {
            if (options.response.statusCode) {
                if (options.response.statusCode.assignTo) {
                    await ContextUtil.assignTo(
                        context,
                        parameters,
                        snapshot,
                        options.response.statusCode.assignTo,
                        response.statusCode,
                        options.response.statusCode.assignTo.override
                    )
                }

                if (options.response.statusCode.pushTo) {
                    await ContextUtil.pushTo(
                        context,
                        parameters,
                        snapshot,
                        options.response.statusCode.assignTo,
                        response.statusCode,
                        options.response.statusCode.assignTo.children,
                        options.response.statusCode.assignTo.override
                    )
                }
            }

            if (options.response.body) {
                if (options.response.body.assignTo) {
                    await ContextUtil.assignTo(
                        context,
                        parameters,
                        snapshot,
                        options.response.body.assignTo,
                        response.body,
                        options.response.body.assignTo.override
                    )
                }

                if (options.response.body.pushTo) {
                    await ContextUtil.pushTo(
                        context,
                        parameters,
                        snapshot,
                        options.response.body.assignTo,
                        response.body,
                        options.response.body.assignTo.children,
                        options.response.body.assignTo.override
                    )
                }

                if (options.response.body.saveTo) {
                    const path = FSUtil.getAbsolutePath(options.response.body.saveTo, snapshot.wd);
                    await FSUtil.mkdirp(dirname(path));
                    await promisify(writeFile)(path, JSON.stringify(response.body), 'utf8');
                }
            }
        }
    }
}