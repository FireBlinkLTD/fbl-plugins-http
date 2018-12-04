import { Service, Inject } from 'typedi';
import { IHTTPRequestOptions, IHTTPResponseOptions } from '../interfaces';
import * as got from 'got';
import {URLSearchParams} from 'url';
import * as FormData from 'form-data';
import { createReadStream, createWriteStream, unlink} from 'fs';
import { FSUtil } from 'fbl/dist/src/utils';
import { dirname } from 'path';
import { promisify } from 'util';
import { IncomingHttpHeaders } from 'http';
import { WritableStreamBuffer } from 'stream-buffers';
import { ActionSnapshot } from 'fbl/dist/src/models';
import { IContext, IDelegatedParameters } from 'fbl/dist/src/interfaces';
import { ResponseUtil } from '../utils/ResponseUtil';
import { FlowService } from 'fbl/dist/src/services';
import { lookup } from 'mime-types';
import { RequestUtil } from '../utils/RequestUtil';

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
    async makeRequest(context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters, requestOptions: IHTTPRequestOptions, responseOptions?: IHTTPResponseOptions) {
        const gotRequestOptions = await this.prepareGotRequestOptions(context, snapshot, parameters, requestOptions);

        let result: {
            statusCode: number;
            headers: IncomingHttpHeaders;
            body?: Buffer;
        } = {
            statusCode: -1,
            headers: {}
        };

        try {
            if (responseOptions && responseOptions.body && responseOptions.body.saveTo) {
                let targetFile = responseOptions.body.saveTo;
                targetFile = FSUtil.getAbsolutePath(targetFile, snapshot.wd);
                await FSUtil.mkdirp(dirname(targetFile));

                snapshot.log(`Make ${requestOptions.method} request to ${requestOptions.url}`, true);
                result = await this.makeRequestAndSaveBodyToFile(requestOptions.url, targetFile, gotRequestOptions);
                snapshot.log(`Complete ${requestOptions.method} request to ${requestOptions.url}`, true);
                if (responseOptions.body.assignTo || responseOptions.body.pushTo) {
                    result.body = await FSUtil.readFile(targetFile);
                }
            } else {
                result = await this.makeRequestAndSaveResponseToBuffer(requestOptions.url, gotRequestOptions);
            }

            if (result.body && responseOptions && responseOptions.body && (responseOptions.body.assignTo || responseOptions.body.pushTo)) {
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

                    await ResponseUtil.assignTo(
                        responseOptions.body.assignTo,
                        context,
                        snapshot,
                        parameters,
                        content
                    );
                }

                /* istanbul ignore else */
                if (responseOptions.body.pushTo) {
                    let as = 'base64';
                    /* istanbul ignore else */
                    if (typeof responseOptions.body.pushTo !== 'string' && responseOptions.body.pushTo.as) {
                        as = responseOptions.body.pushTo.as;
                    }

                    let content;            
                    if (as === 'json') {
                        content = JSON.parse(result.body.toString('utf8'));
                    } else {
                        content = result.body.toString(as);
                    }

                    await ResponseUtil.pushTo(
                        responseOptions.body.pushTo,
                        context,
                        snapshot,
                        parameters,
                        content
                    );
                }
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

            throw e;
        } finally {
            /* istanbul ignore else */
            if (result) {
                await ResponseUtil.assign(
                    responseOptions.statusCode,
                    context,
                    snapshot,
                    parameters,
                    result.statusCode
                );

                await ResponseUtil.assign(
                    responseOptions.headers,
                    context,
                    snapshot,
                    parameters,
                    result.headers
                );                
            }
        }
    }

    /**
     * Make HTTP request that stores response in a buffer
     * @param url
     * @param options 
     */
    private async makeRequestAndSaveResponseToBuffer(url: string, options: got.GotOptions<any>): Promise<{statusCode: number, headers: IncomingHttpHeaders, body: Buffer}> {
        const ws = new WritableStreamBuffer();
        const result = await this.makeStreamRequest(url, ws, options);
        
        return {
            statusCode: result.statusCode,
            headers: result.headers,
            body: ws.getContents()
        };
    }

    /**
     * Make HTTP request that stores response body in file
     * @param url
     * @param targetFile 
     * @param options 
     */
    private async makeRequestAndSaveBodyToFile(url: string, targetFile: string, options: got.GotOptions<any>): Promise<{statusCode: number, headers: IncomingHttpHeaders}> {
        try {
            const ws = createWriteStream(targetFile);

            return await this.makeStreamRequest(url, ws, options);
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
     * @param url
     * @param targetFile 
     * @param options 
     */
    private async makeStreamRequest(url: string, ws: NodeJS.WritableStream, options: got.GotOptions<any>): Promise<{statusCode: number, headers: IncomingHttpHeaders}> {
        let statusCode: number;
        let headers: IncomingHttpHeaders;

        try {
            await new Promise((res, rej) => {
                const stream = got.stream(url, options);

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
        } catch (e) {
            e.statusCode = statusCode; 
            e.headers = headers;
            throw e;
        }          
        
        return {statusCode, headers};
    }

    /**
     * Prepare request options for 'got' module.
     * @param {IContext} context
     * @param {ActionSnapshot} snapshot
     * @param {IDelegatedParameters} parameters
     * @param {IHTTPRequestOptions} requestOptions 
     * @param {IHTTPRequestOptions} requestOptions 
     * @param {IHTTPRequestOptions} requestOptions 
     * @return {got.GotOptions}
     */
    private async prepareGotRequestOptions(
        context: IContext, 
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        requestOptions: IHTTPRequestOptions
    ): Promise<got.GotOptions<any>> {
        const options: got.GotOptions<any> = {
            method: requestOptions.method,
            headers: requestOptions.headers || {},
            timeout: (requestOptions.timeout || 60) * 1000
        };

        /* istanbul ignore else */
        if (!RequestUtil.isHeaderExists(options.headers, 'user-agent')) {
            options.headers['user-agent'] = '@fbl-plugins/http (https://fbl.fireblink.com)';
        }

        if (requestOptions.query) {
            options.query = new URLSearchParams(requestOptions.query);
        }

        if (requestOptions.body) {
            if (requestOptions.body.form) {
                /* istanbul ignore else */
                if (requestOptions.body.form.urlencoded) {
                    if (!RequestUtil.isHeaderExists(requestOptions.headers, 'content-type')) {
                        requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded';
                    }

                    const empty = !requestOptions.body.form.urlencoded || Object.keys(requestOptions.body.form.urlencoded).length === 0;
                    if (!empty) {
                        (options as got.GotFormOptions<any>).form = true;                    
                        (options as got.GotFormOptions<any>).body = requestOptions.body.form.urlencoded;
                    }
                } 

                /* istanbul ignore else */
                if (requestOptions.body.form.multipart) {
                    const form = new FormData();
                    /* istanbul ignore else */
                    if (requestOptions.body.form.multipart.fields) {
                        for (const key of Object.keys(requestOptions.body.form.multipart.fields)) {
                            form.append(key, requestOptions.body.form.multipart.fields[key].toString());
                        }
                    }
    
                    /* istanbul ignore else */
                    if (requestOptions.body.form.multipart.files) {
                        for (const key of Object.keys(requestOptions.body.form.multipart.files)) {
                            const path = FSUtil.getAbsolutePath(requestOptions.body.form.multipart.files[key], snapshot.wd);
                            form.append(key, createReadStream(path));
                        }
                    }
    
                    (options as got.GotBodyOptions<any>).body = form;                    
                }          
            }

            if (requestOptions.body.json) {
                (options as got.GotBodyOptions<any>).body = JSON.stringify(requestOptions.body.json);                
                options.headers['content-type'] = 'application/json';
            }

            if (requestOptions.body.file) {
                let path;
                let template = false;
                if (typeof requestOptions.body.file === 'string') {
                    path = requestOptions.body.file;
                } else {
                    path = requestOptions.body.file.path;
                    template = requestOptions.body.file.template;
                }
                
                // find out absolute path
                path = FSUtil.getAbsolutePath(path, snapshot.wd);

                /* istanbul ignore else */
                if (!RequestUtil.isHeaderExists(options.headers, 'content-type')) {
                    /* istanbul ignore next */
                    options.headers['content-type'] = lookup(path) || 'application/octet-stream';
                } 

                if (!template) {
                    (options as got.GotBodyOptions<any>).body = createReadStream(path);                                       
                } else {
                    let content = await FSUtil.readTextFile(path);

                    // resolve with global template delimiter first
                    content = await this.flowService.resolveTemplate(
                        context.ejsTemplateDelimiters.global,
                        snapshot.wd,
                        content,
                        context,
                        parameters
                    );

                    // resolve local template delimiter
                    content = await this.flowService.resolveTemplate(
                        context.ejsTemplateDelimiters.local,
                        snapshot.wd,
                        content,
                        context,
                        parameters
                    );

                    (options as got.GotBodyOptions<any>).body = content;
                }
            }
        }

        if (!(options as got.GotBodyOptions<any>).body) {
            (options as got.GotBodyOptions<any>).body = new Buffer(0);
        }
        
        return options;
    }
}
