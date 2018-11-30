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
class JSONActionHandlersTestSuite {
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
        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/json',
                    method: method,
                    query: {
                        test: 'yes'
                    },
                    headers: {
                        'X-Test': '1234'
                    },
                    body: {
                        json: {
                            test: true
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
        });
    }

    @test()
    async pushResponseTo(): Promise<void> {
        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/json',
                    method: method,
                    query: {
                        test: 'yes'
                    },
                    headers: {
                        'X-Test': '1234'
                    },
                    body: {
                        json: {
                            test: true
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
                test: true
            });
        });
    }

    @test()
    async saveResponseToFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);

        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const file = await tempPathRegistry.createTempFile();

            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/json',
                    method: method,
                    // TODO: figure out why POST, PUT, PATCH without body hangs
                    // body: {
                    //     json: {
                    //         test: true
                    //     }
                    // }
                },
                response: <IHTTPResponseOptions> {
                    body: {
                        saveTo: basename(file)
                    }
                }
            };

            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(file), 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});

            const body = await FSUtil.readYamlFromFile(file);
            assert.strictEqual(body.method, method);
        });
    }

    @test()
    async bodyFromFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);
        const file = await tempPathRegistry.createTempFile(false, '.json');
        await promisify(writeFile)(file, JSON.stringify({file: true}), 'utf8');

        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/json',
                    method: method,
                    body: {
                        file: basename(file)
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
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(file), 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});

            assert.strictEqual(context.ctx.response.code, 200);
            assert.deepStrictEqual(context.ctx.response.body.method, method);
            assert.deepStrictEqual(context.ctx.response.body.body, {
                file: true
            });
        });
    }

    @test()
    async bodyFromTemplateFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);
        const file = await tempPathRegistry.createTempFile(false, '.json');
        await promisify(writeFile)(file, JSON.stringify({file: '<%- ctx.test %>'}), 'utf8');

        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'): Promise<void> => {
            const options = {
                request: <IHTTPRequestOptions> {
                    url: DummyServerWrapper.ENDPOINT + '/json',
                    method: method,
                    body: {
                        file: {
                            path: basename(file),
                            template: true
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
            context.ctx.test = 'yes';
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(file), 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});

            assert.strictEqual(context.ctx.response.code, 200);
            assert.deepStrictEqual(context.ctx.response.body.method, method);
            assert.deepStrictEqual(context.ctx.response.body.body, {
                file: 'yes'
            });
        });
    }
}
