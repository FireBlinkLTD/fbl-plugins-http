import { ActionSnapshot, FSUtil, ContextUtil, IContext, IDelegatedParameters, FlowService } from 'fbl';
import { Service, Inject } from 'typedi';
import { IHTTPRequestOptions, IHTTPResponseOptions } from '../interfaces';
import * as superagent from 'superagent';
import { createWriteStream, unlink } from 'fs';
import { dirname } from 'path';
import { promisify } from 'util';
import { IncomingHttpHeaders } from 'http';
import { WritableStreamBuffer } from 'stream-buffers';
import { lookup } from 'mime-types';
import { isHeaderExists } from '../utils/RequestUtil';

@Service()
export class HTTPRequestService {
    @Inject(() => FlowService)
    flowService: FlowService;

    /**
     * Make HTTP request
     * @param snapshot
     * @param parameters
     * @param requestOptions
     * @param responseOptions
     */
    async makeRequest(
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        requestOptions: IHTTPRequestOptions,
        responseOptions?: IHTTPResponseOptions,
    ) {
        let result: {
            statusCode: number;
            headers: IncomingHttpHeaders;
            body?: Buffer | false;
        } = {
            statusCode: -1,
            headers: {},
        };

        try {
            if (responseOptions && responseOptions.body && responseOptions.body.saveTo) {
                let targetFile = responseOptions.body.saveTo;
                targetFile = FSUtil.getAbsolutePath(targetFile, snapshot.wd);
                await FSUtil.mkdirp(dirname(targetFile));

                snapshot.log(`Make ${requestOptions.method} request to ${requestOptions.url}`);
                result = await this.makeRequestAndSaveBodyToFile(
                    context,
                    snapshot,
                    parameters,
                    requestOptions,
                    targetFile,
                    responseOptions.statusCode && responseOptions.statusCode.successful,
                );
                snapshot.log(`Complete ${requestOptions.method} request to ${requestOptions.url}`);
                if (responseOptions.body.assignTo || responseOptions.body.pushTo) {
                    result.body = await FSUtil.readFile(targetFile);
                }
            } else {
                result = await this.makeRequestAndSaveResponseToBuffer(
                    context,
                    snapshot,
                    parameters,
                    requestOptions,
                    responseOptions && responseOptions.statusCode && responseOptions.statusCode.successful,
                );
            }
        } catch (e) {
            /* istanbul ignore else */
            if (e.statusCode) {
                result.statusCode = e.statusCode;
            }

            /* istanbul ignore else */
            if (e.headers) {
                result.headers = e.headers;
            }

            /* istanbul ignore else */
            if (e.body) {
                result.body = e.body;
            }

            throw e;
        } finally {
            /* istanbul ignore else */
            if (result && responseOptions) {
                if (responseOptions.statusCode) {
                    ContextUtil.assignTo(
                        context,
                        parameters,
                        snapshot,
                        responseOptions.statusCode.assignTo,
                        result.statusCode,
                    );

                    ContextUtil.pushTo(
                        context,
                        parameters,
                        snapshot,
                        responseOptions.statusCode.pushTo,
                        result.statusCode,
                    );
                }

                if (responseOptions.headers) {
                    ContextUtil.assignTo(
                        context,
                        parameters,
                        snapshot,
                        responseOptions.headers.assignTo,
                        result.headers,
                    );

                    ContextUtil.pushTo(context, parameters, snapshot, responseOptions.headers.pushTo, result.headers);
                }

                if (
                    result.body &&
                    responseOptions.body &&
                    (responseOptions.body.assignTo || responseOptions.body.pushTo)
                ) {
                    /* istanbul ignore else */
                    if (responseOptions.body.assignTo) {
                        let asType = 'base64';
                        if (typeof responseOptions.body.assignTo !== 'string' && responseOptions.body.assignTo.as) {
                            asType = responseOptions.body.assignTo.as;
                        }

                        let content;
                        if (asType === 'json') {
                            content = JSON.parse(result.body.toString('utf8'));
                        } else {
                            content = result.body.toString(asType);
                        }

                        ContextUtil.assignTo(context, parameters, snapshot, responseOptions.body.assignTo, content);
                    }

                    /* istanbul ignore else */
                    if (responseOptions.body.pushTo) {
                        let asType = 'base64';
                        /* istanbul ignore else */
                        if (typeof responseOptions.body.pushTo !== 'string' && responseOptions.body.pushTo.as) {
                            asType = responseOptions.body.pushTo.as;
                        }

                        let content;
                        if (asType === 'json') {
                            content = JSON.parse(result.body.toString('utf8'));
                        } else {
                            content = result.body.toString(asType);
                        }

                        ContextUtil.pushTo(context, parameters, snapshot, responseOptions.body.pushTo, content);
                    }
                }
            }
        }
    }

    /**
     * Make HTTP request that stores response in a buffer
     */
    private async makeRequestAndSaveResponseToBuffer(
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        options: IHTTPRequestOptions,
        successfulStatusCodes?: number[],
    ): Promise<{ statusCode: number; headers: IncomingHttpHeaders; body: Buffer | false }> {
        const ws = new WritableStreamBuffer();
        try {
            const result = await this.makeStreamRequest(
                context,
                snapshot,
                parameters,
                options,
                ws,
                successfulStatusCodes,
            );

            return {
                statusCode: result.statusCode,
                headers: result.headers,
                body: ws.getContents(),
            };
        } catch (e) {
            e.body = ws.getContents();
            throw e;
        }
    }

    /**
     * Make HTTP request that stores response body in file
     */
    private async makeRequestAndSaveBodyToFile(
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        options: IHTTPRequestOptions,
        targetFile: string,
        successfulStatusCodes?: number[],
    ): Promise<{ statusCode: number; headers: IncomingHttpHeaders }> {
        try {
            const ws = createWriteStream(targetFile);

            return await this.makeStreamRequest(context, snapshot, parameters, options, ws, successfulStatusCodes);
        } catch (e) {
            const exists = await FSUtil.exists(targetFile);
            /* istanbul ignore else */
            if (exists) {
                await promisify(unlink)(targetFile);
            }
            throw e;
        }
    }

    /**
     * Make HTTP request that writes response body to stream
     */
    private async makeStreamRequest(
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        options: IHTTPRequestOptions,
        ws: NodeJS.WritableStream,
        successfulStatusCodes?: number[],
    ): Promise<{ statusCode: number; headers: IncomingHttpHeaders }> {
        const { statusCode, headers } = await this.prepareRequest(context, snapshot, parameters, options, ws);

        if (successfulStatusCodes && successfulStatusCodes.indexOf(statusCode) < 0) {
            const error = new Error(`Response code ${statusCode}`);
            (<any>error).statusCode = statusCode;
            (<any>error).headers = headers;
            throw error;
        }

        if (!successfulStatusCodes && statusCode >= 300) {
            const error = new Error(`Response code ${statusCode}`);
            (<any>error).statusCode = statusCode;
            (<any>error).headers = headers;
            throw error;
        }

        return { statusCode, headers };
    }

    private async prepareRequest(
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        options: IHTTPRequestOptions,
        ws: NodeJS.WritableStream,
    ): Promise<{
        statusCode: number;
        headers: any;
    }> {
        let client = superagent(options.method, options.url).timeout((options.timeout || 60) * 1000);

        if (options.headers) {
            client = client.set(options.headers);
        }

        if (!isHeaderExists(options.headers, 'user-agent')) {
            client = client.set('user-agent', '@fbl-plugins/http (https://fbl.fireblink.com)');
        }

        if (options.query) {
            client = client.query(options.query);
        }

        if (options.body) {
            if (options.body.form) {
                /* istanbul ignore else */
                if (options.body.form.urlencoded) {
                    client = client.type('form').send(options.body.form.urlencoded);
                }

                /* istanbul ignore else */
                if (options.body.form.multipart) {
                    /* istanbul ignore else */
                    if (options.body.form.multipart.fields) {
                        for (const key of Object.keys(options.body.form.multipart.fields)) {
                            client = client.field(key, options.body.form.multipart.fields[key].toString());
                        }
                    }

                    /* istanbul ignore else */
                    if (options.body.form.multipart.files) {
                        for (const key of Object.keys(options.body.form.multipart.files)) {
                            const path = FSUtil.getAbsolutePath(options.body.form.multipart.files[key], snapshot.wd);
                            client = client.attach(key, path);
                        }
                    }
                }
            }

            if (options.body.json) {
                client = client.send(options.body.json);
            }

            if (options.body.file) {
                let path;
                let template = false;
                if (typeof options.body.file === 'string') {
                    path = options.body.file;
                } else {
                    path = options.body.file.path;
                    template = options.body.file.template;
                }

                // find out absolute path
                path = FSUtil.getAbsolutePath(path, snapshot.wd);

                /* istanbul ignore else */
                if (!isHeaderExists(options.headers, 'content-type')) {
                    /* istanbul ignore next */
                    client.set('content-type', lookup(path) || 'application/octet-stream');
                }

                if (!template) {
                    const content = await FSUtil.readTextFile(path);
                    client = client.send(content);
                } else {
                    let content = await FSUtil.readTextFile(path);

                    // resolve with global template delimiter first
                    content = await this.flowService.resolveTemplate(
                        context.ejsTemplateDelimiters.global,
                        content,
                        context,
                        snapshot,
                        parameters,
                    );

                    // resolve local template delimiter
                    content = await this.flowService.resolveTemplate(
                        context.ejsTemplateDelimiters.local,
                        content,
                        context,
                        snapshot,
                        parameters,
                    );

                    client = client.send(content);
                }
            }
        }

        client.pipe(ws);

        let statusCode;
        let headers;
        client.on('response', (res) => {
            statusCode = res.status;
            headers = res.header;
        });

        await new Promise((res, rej) => {
            ws.on('finish', res);
            client.on('error', rej);
        });

        return {
            statusCode,
            headers,
        };
    }
}
