import {ActionHandler, ActionSnapshot} from 'fbl/dist/src/models';
import * as Joi from 'joi';
import {FBL_PLUGIN_HTTP_BASE_SCHEMA} from '../../schemas';
import {GotFn, GotJSONOptions} from 'got';
import {IActionHandlerMetadata, IContext, IDelegatedParameters} from 'fbl/dist/src/interfaces';
import {ContextUtil, FSUtil} from 'fbl/dist/src/utils';
import {dirname} from 'path';
import {promisify} from 'util';
import {writeFile} from 'fs';
import {URLSearchParams} from 'url';
import {ResponseUtil} from '../../utils/ResponseUtil';

export abstract class BaseJsonActionHandler extends ActionHandler {
    getMetadata(): IActionHandlerMetadata {
        const name = this.name();

        return <IActionHandlerMetadata> {
            id: `com.fireblink.fbl.plugins.http.${name}.json`,
            aliases: [
                `fbl.plugins.http.${name}.json`,
                `plugins.http.${name}.json`,
                `http.${name}.json`,
                `${name}.json`,
            ]
        };
    }

    getValidationSchema(): Joi.SchemaLike | null {
        return FBL_PLUGIN_HTTP_BASE_SCHEMA;
    }

    abstract name(): string;
    abstract gotFn(): GotFn;

    async validate(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        await super.validate(options, context, snapshot, parameters);

        if (options.request.body) {
            if (options.request.body.form) {
                throw new Error('request.body.form parameter is not allowed for JSON requests');
            }

            if (options.request.body.file) {
                const path = FSUtil.getAbsolutePath(options.request.body.file, snapshot.wd);
                const exists = await FSUtil.exists(path);

                if (!exists) {
                    throw new Error(`Unable to locate body payload file at path: ${path}`);
                }
            }
        }
    }

    async execute(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        const fn = this.gotFn();

        const requestOptions = <GotJSONOptions> {
            headers: options.request.headers || {},
            timeout: (options.request.timeout || 60) * 1000,
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

        /* istanbul ignore else */
        if (options.response) {
            const responseAssignments = [
                {config: options.response.statusCode, value: response.statusCode},
                {config: options.response.headers, value: response.headers},
                {config: options.response.body, value: response.body}
            ];

            for (const assignment of responseAssignments) {
                await ResponseUtil.assign(
                    assignment.config,
                    context,
                    snapshot,
                    parameters,
                    assignment.value
                );
            }

            /* istanbul ignore else */
            if (options.response.body) {
                if (options.response.body.saveTo) {
                    const path = FSUtil.getAbsolutePath(options.response.body.saveTo, snapshot.wd);
                    await FSUtil.mkdirp(dirname(path));
                    await promisify(writeFile)(path, JSON.stringify(response.body), 'utf8');
                }
            }
        }
    }
}
