import { suite, test } from 'mocha-typescript';
import { Container } from 'typedi';
import { DummyServerWrapper } from '../assets/dummy.http.server.wrapper';
import { HTTPRequestActionHandler } from '../../src/handlers';
import { ActionHandler, ActionSnapshot, ContextUtil } from 'fbl';
import * as assert from 'assert';
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

        await Promise.all(
            methods.map(
                (method: any): Promise<void> => {
                    return fn(new HTTPRequestActionHandler(), method);
                },
            ),
        );
    }

    @test()
    async minimumParameters(): Promise<void> {
        await URLEncodedFormTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/form/urlencoded',
                        method: method,
                        body: {
                            form: {
                                urlencoded: {
                                    test: 'form',
                                },
                            },
                        },
                    },
                };

                const context = ContextUtil.generateEmptyContext();
                const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

                const processor = actionHandler.getProcessor(options, context, snapshot, {});
                await processor.validate();
                await processor.execute();
            },
        );
    }

    @test()
    async assignResponseTo(): Promise<void> {
        await URLEncodedFormTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/form/urlencoded',
                        method: method,
                        query: {
                            test: 'yes',
                        },
                        headers: {
                            'X-Test': '1234',
                            'content-type': 'application/x-www-form-urlencoded',
                        },
                        body: {
                            form: {
                                urlencoded: {
                                    test: 'form',
                                },
                            },
                        },
                    },
                    response: <IHTTPResponseOptions>{
                        statusCode: {
                            assignTo: {
                                ctx: '$.response.code',
                            },
                        },

                        body: {
                            assignTo: {
                                ctx: '$.response.body',
                                as: 'json',
                            },
                        },
                    },
                };

                const context = ContextUtil.generateEmptyContext();
                const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

                const processor = actionHandler.getProcessor(options, context, snapshot, {});
                await processor.validate();
                await processor.execute();

                assert.strictEqual(context.ctx.response.code, 200);
                assert.deepStrictEqual(context.ctx.response.body.method, method);
                assert.deepStrictEqual(context.ctx.response.body.query, options.request.query);
                assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
                assert.deepStrictEqual(context.ctx.response.body.body, {
                    test: 'form',
                });
            },
        );
    }

    @test()
    async pushResponseTo(): Promise<void> {
        await URLEncodedFormTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/form/urlencoded',
                        method: method,
                        query: {
                            test: 'yes',
                        },
                        headers: {
                            'X-Test': '1234',
                        },
                        body: {
                            form: {
                                urlencoded: {
                                    test: 'form',
                                },
                            },
                        },
                    },
                    response: <IHTTPResponseOptions>{
                        statusCode: {
                            pushTo: '$.ctx.response.code',
                        },

                        body: {
                            pushTo: {
                                ctx: '$.response.body',
                                as: 'json',
                            },
                        },
                    },
                };

                const context = ContextUtil.generateEmptyContext();
                const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

                const processor = actionHandler.getProcessor(options, context, snapshot, {});
                await processor.validate();
                await processor.execute();

                assert.deepStrictEqual(context.ctx.response.code, [200]);
                assert.deepStrictEqual(context.ctx.response.body[0].method, method);
                assert.deepStrictEqual(context.ctx.response.body[0].query, options.request.query);
                assert.strictEqual(context.ctx.response.body[0].headers['x-test'], '1234');
                assert.deepStrictEqual(context.ctx.response.body[0].body, {
                    test: 'form',
                });
            },
        );
    }

    @test()
    async emptyForm(): Promise<void> {
        await URLEncodedFormTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/form/urlencoded',
                        method: method,
                        query: {
                            test: 'yes',
                        },
                        headers: {
                            'X-Test': '1234',
                        },
                        body: {
                            form: {
                                urlencoded: {},
                            },
                        },
                    },
                    response: <IHTTPResponseOptions>{
                        statusCode: {
                            assignTo: {
                                ctx: '$.response.code',
                            },
                        },

                        body: {
                            assignTo: {
                                ctx: '$.response.body',
                                as: 'json',
                            },
                        },
                    },
                };

                const context = ContextUtil.generateEmptyContext();
                const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

                const processor = actionHandler.getProcessor(options, context, snapshot, {});
                await processor.validate();
                await processor.execute();

                assert.strictEqual(context.ctx.response.code, 200);
                assert.deepStrictEqual(context.ctx.response.body.method, method);
                assert.deepStrictEqual(context.ctx.response.body.query, options.request.query);
                assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
                assert.deepStrictEqual(context.ctx.response.body.body, {});
            },
        );
    }
}
