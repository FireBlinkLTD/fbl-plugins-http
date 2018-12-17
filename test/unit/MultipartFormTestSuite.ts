import {
    ActionHandler, 
    ActionSnapshot,
    ContextUtil,
    TempPathsRegistry
} from 'fbl';
import {suite, test} from 'mocha-typescript';
import {Container} from 'typedi';
import {DummyServerWrapper} from '../assets/dummy.http.server.wrapper';
import {HTTPRequestActionHandler} from '../../src/handlers';
import * as assert from 'assert';
import {basename, dirname} from 'path';
import {promisify} from 'util';
import {writeFile, readFile} from 'fs';
import { IHTTPRequestOptions, IHTTPResponseOptions } from '../../src/interfaces';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

@suite()
class MultipartFormTestSuite {
    async after(): Promise<void> {
        Container.reset();
    }

    private static async forEachAction(fn: Function): Promise<void> {
        const methods = ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'];

        await Promise.all(methods.map((method: any): Promise<void> => {
            return fn(new HTTPRequestActionHandler(), method);
        }));
    }

    @test()
    async minimumParameters(): Promise<void> {
        await MultipartFormTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/form/multipart',
                    method: method,
                    body: {
                        form: {
                            multipart: {
                                fields: {
                                    test: 'form'
                                }
                            }
                        }
                    }
                }
            };

            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});        
        });
    }

    @test()
    async assignResponseTo(): Promise<void> {
        await MultipartFormTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/form/multipart',
                    method: method,
                    query: {
                        test: 'yes'
                    },
                    headers: {
                        'X-Test': '1234'            
                    },
                    body: {
                        form: {
                            multipart: {
                                fields: {
                                    test: 'form'
                                }
                            }
                        }
                    }
                },
                response: <IHTTPResponseOptions> {
                    statusCode: {
                        assignTo: {
                            ctx: '$.response.code'
                        }
                    },
    
                    body: {
                        assignTo: {
                            ctx: '$.response.body',
                            as: 'json' 
                        }                    
                    }
                }
            };

            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});
        
            assert.strictEqual(context.ctx.response.code, 200);
            assert.deepStrictEqual(context.ctx.response.body.method, method);
            assert.deepStrictEqual(context.ctx.response.body.query, options.request.query);
            assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
            assert.deepStrictEqual(context.ctx.response.body.body, {
                fields: {
                    test: ['form']
                },
                files: {}
            });
        });
    }

    @test()
    async pushResponseTo(): Promise<void> {
        const tempPathsRegistry = Container.get(TempPathsRegistry);
        const tempFile = await tempPathsRegistry.createTempFile();

        let content = '';
        for (let i = 0; i < 10 * 1024; i++) {
            content += 'test';
        }
        
        await promisify(writeFile)(tempFile, content, 'utf8');

        await MultipartFormTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/form/multipart',
                    method: method,
                    query: {
                        test: 'yes'
                    },
                    headers: {
                        'X-Test': '1234'
                    },
                    body: {
                        form: {
                            multipart: {
                                fields: {
                                    test: 'form'
                                },
                                files: {
                                    ft: basename(tempFile)
                                }
                            }
                        }
                    }
                },
                response: <IHTTPResponseOptions> {
                    statusCode: {
                        pushTo: '$.ctx.response.code'
                    },
    
                    body: {
                        pushTo: {
                            ctx: '$.response.body',
                            as: 'json'
                        }
                    }
                }
            };

            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(tempFile), 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});

            assert.deepStrictEqual(context.ctx.response.code, [200]);
            assert.deepStrictEqual(context.ctx.response.body[0].method, method);
            assert.deepStrictEqual(context.ctx.response.body[0].query, options.request.query);
            assert.strictEqual(context.ctx.response.body[0].headers['x-test'], '1234');
            assert.deepStrictEqual(context.ctx.response.body[0].body.fields, {
                    test: ['form']                
            });

            assert.strictEqual(context.ctx.response.body[0].body.files.ft.length, 1);
            assert.strictEqual(context.ctx.response.body[0].body.files.ft[0].size, content.length);
            
            const actualContent = await promisify(readFile)(context.ctx.response.body[0].body.files.ft[0].path, 'utf8');
            assert.deepStrictEqual(actualContent, content);            
        });
    }
}
