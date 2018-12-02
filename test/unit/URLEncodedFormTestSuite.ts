import {suite, test} from 'mocha-typescript';
import {Container} from 'typedi';
import {DummyServerWrapper} from '../assets/dummy.http.server.wrapper';
import {HTTPRequestActionHandler} from '../../src/handlers';
import {ContextUtil, FSUtil} from 'fbl/dist/src/utils';
import {ActionHandler, ActionSnapshot} from 'fbl/dist/src/models';
import * as assert from 'assert';
import {TempPathsRegistry} from 'fbl/dist/src/services';
import {basename, dirname} from 'path';
import {promisify} from 'util';
import {writeFile} from 'fs';
import { IHTTPRequestOptions, IHTTPResponseOptions } from '../../src/interfaces';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

@suite()
class URLEncodedFormTestSuite {
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
    async assignResponseTo(): Promise<void> {
        await URLEncodedFormTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/form',
                    method: method,
                    query: {
                        test: 'yes'
                    },
                    headers: {
                        'X-Test': '1234',
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: {
                        form: {
                            fields: {
                                test: 'form'
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
        
            console.log(context.ctx.response.body.headers);

            assert.strictEqual(context.ctx.response.code, 200);
            assert.deepStrictEqual(context.ctx.response.body.method, method);
            assert.deepStrictEqual(context.ctx.response.body.query, options.request.query);
            assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
            assert.deepStrictEqual(context.ctx.response.body.body, {
                test: 'form'
            });
        });
    }

    @test()
    async pushResponseTo(): Promise<void> {
        await URLEncodedFormTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/form',
                    method: method,
                    query: {
                        test: 'yes'
                    },
                    headers: {
                        'X-Test': '1234',
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: {
                        form: {
                            fields: {
                                test: 'form'
                            }
                        }
                    }
                },
                response: <IHTTPResponseOptions> {
                    statusCode: {
                        pushTo: {
                            ctx: '$.response.code'                
                        }
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
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});

            assert.deepStrictEqual(context.ctx.response.code, [200]);
            assert.deepStrictEqual(context.ctx.response.body[0].method, method);
            assert.deepStrictEqual(context.ctx.response.body[0].query, options.request.query);
            assert.strictEqual(context.ctx.response.body[0].headers['x-test'], '1234');
            assert.deepStrictEqual(context.ctx.response.body[0].body, {
                test: 'form'
            });
        });
    }
}
