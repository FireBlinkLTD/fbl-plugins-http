import {ActionHandler, ActionSnapshot} from 'fbl/dist/src/models';
import {IActionHandlerMetadata, IContext, IDelegatedParameters} from 'fbl/dist/src/interfaces';
import * as Joi from 'joi';
import {FBL_PLUGIN_HTTP_REQUEST_SCHEMA} from '../../schemas';
import {FBL_ASSIGN_TO_SCHEMA, FBL_PUSH_TO_SCHEMA} from 'fbl/dist/src/schemas';
import {promisify} from 'util';
import {createWriteStream, unlink} from 'fs';
import * as got from 'got';
import {URLSearchParams} from 'url';
import {FSUtil} from 'fbl/dist/src/utils';
import {Container} from 'typedi';
import {TempPathsRegistry} from 'fbl/dist/src/services';
import {dirname} from 'path';
import {ResponseUtil} from '../../utils/ResponseUtil';

export class FileDownloadActionHandler extends ActionHandler {
    static metadata =  <IActionHandlerMetadata> {
        id: `com.fireblink.fbl.plugins.http.download`,
        aliases: [
            `fbl.plugins.http.download`,
            `plugins.http.download`,
            `http.download`,
            `download`,
        ]
    };

    static validationSchema = Joi.object({
        request: FBL_PLUGIN_HTTP_REQUEST_SCHEMA,
        response: Joi.object({
            statusCode: Joi.object({
                assignTo: FBL_ASSIGN_TO_SCHEMA,
                pushTo: FBL_PUSH_TO_SCHEMA
            })
                .options({
                    allowUnknown: false
                })
                .or('assignTo', 'pushTo'),

            headers: Joi.object({
                assignTo: FBL_ASSIGN_TO_SCHEMA,
                pushTo: FBL_PUSH_TO_SCHEMA
            })
                .options({
                    allowUnknown: false
                })
                .or('assignTo', 'pushTo'),

            body: Joi.object({
                assignTo: FBL_ASSIGN_TO_SCHEMA.keys({
                    encoding: Joi.string().allow('base64', 'utf8', 'hex').required()
                }),
                pushTo: FBL_PUSH_TO_SCHEMA.keys({
                    encoding: Joi.string().allow('base64', 'utf8', 'hex').required()
                }),
                saveTo: Joi.string()
            })
                .required()
                .options({
                    allowUnknown: false
                })
                .or('assignTo', 'pushTo', 'saveTo')
        })
            .required()
            .options({
                allowUnknown: false,
                abortEarly: true
            })
    })
        .required()
        .options({
            abortEarly: true,
            allowUnknown: false
        });

    getMetadata(): IActionHandlerMetadata {
        return FileDownloadActionHandler.metadata;
    }

    getValidationSchema(): Joi.SchemaLike | null {
        return FileDownloadActionHandler.validationSchema;
    }

    async validate(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        await super.validate(options, context, snapshot, parameters);

        if (options.request.body) {
            throw new Error('request.body configuration is not allowed for file download requests');
        }
    }

    async execute(options: any, context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): Promise<void> {
        const requestOptions: got.GotBodyOptions<any> = {
            headers: options.request.headers || {},
            timeout: (options.request.timeout || 60) * 1000
        };

        if (options.request.query) {
            requestOptions.query = new URLSearchParams(options.request.query);
        }

        let targetFile = options.response.body.saveTo;
        if (targetFile) {
            targetFile = FSUtil.getAbsolutePath(targetFile, snapshot.wd);
            await FSUtil.mkdirp(dirname(targetFile));
        } else {
            targetFile = await Container.get(TempPathsRegistry).createTempFile();
        }

        let statusCode: number;
        let headers: {[key: string]: any};

        const ws = createWriteStream(targetFile, {
            autoClose: true
        });
        try {
            await new Promise((res, rej) => {
                const stream = got.stream(options.request.url, requestOptions);

                stream.on('response', (_response: got.Response<any>) => {
                    statusCode = _response.statusCode;
                    headers = _response.headers;
                });

                stream.pipe(ws);

                ws.on('finish', res);
                stream.on('error', (err: any) => {
                    statusCode = statusCode || err.statusCode;
                    headers = headers || err.headers;
                    rej(err);
                });
            });

            if (options.response.body.assignTo) {
                const content = await FSUtil.readTextFile(targetFile, options.response.body.assignTo.encoding);
                await ResponseUtil.assignTo(
                    options.response.body.assignTo,
                    context,
                    snapshot,
                    parameters,
                    content
                );
            }

            if (options.response.body.pushTo) {
                const content = await FSUtil.readTextFile(targetFile, options.response.body.pushTo.encoding);
                await ResponseUtil.pushTo(
                    options.response.body.pushTo,
                    context,
                    snapshot,
                    parameters,
                    content
                );
            }
        } catch (e) {
            const exists = await FSUtil.exists(targetFile);
            /* istanbul ignore else */
            if (exists) {
                await promisify(unlink)(targetFile);
            }
            throw e;
        } finally {
                await Promise.all([
                    {config: options.response.statusCode, value: statusCode},
                    {config: options.response.headers, value: headers},
                ].map(async (assignment): Promise<void> => {
                    await ResponseUtil.assign(
                        assignment.config,
                        context,
                        snapshot,
                        parameters,
                        assignment.value
                    );
                }));
        }
    }
}
