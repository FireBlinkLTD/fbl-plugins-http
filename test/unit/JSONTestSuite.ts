import { ActionHandler, ActionSnapshot, ContextUtil, FSUtil, TempPathsRegistry } from 'fbl';
import { suite, test } from 'mocha-typescript';
import { Container } from 'typedi';
import { DummyServerWrapper } from '../assets/dummy.http.server.wrapper';
import { HTTPRequestActionHandler } from '../../src/handlers';
import * as assert from 'assert';
import { basename, dirname } from 'path';
import { promisify } from 'util';
import { writeFile } from 'fs';
import { IHTTPRequestOptions, IHTTPResponseOptions } from '../../src/interfaces';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

@suite()
class JSONTestSuite {
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
        await JSONTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/json',
                        method: method,
                        body: {
                            json: {
                                test: true,
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
        await JSONTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/json',
                        method: method,
                        query: {
                            string: 'yes',
                            number: 10,
                            array: ['no', 1],
                        },
                        headers: {
                            'X-Test': '1234',
                        },
                        body: {
                            json: {
                                test: true,
                            },
                        },
                    },
                    response: <IHTTPResponseOptions>{
                        statusCode: {
                            assignTo: {
                                ctx: '$.response.code',
                            },
                        },

                        headers: {
                            pushTo: '$.ctx.response.headers',
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
                assert.deepStrictEqual(context.ctx.response.body.query, {
                    string: 'yes',
                    number: '10',
                    array: 'no,1',
                });

                const request = JSON.parse(context.ctx.response.headers[0]['x-request']);
                assert.strictEqual(request.headers['user-agent'], '@fbl-plugins/http (https://fbl.fireblink.com)');

                assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
                assert.deepStrictEqual(context.ctx.response.body.body, {
                    test: true,
                });
            },
        );
    }

    @test()
    async pushResponseTo(): Promise<void> {
        await JSONTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/json',
                        method: method,
                        query: {
                            test: 'yes',
                        },
                        headers: {
                            'X-Test': '1234',
                        },
                        body: {
                            json: {
                                test: true,
                            },
                        },
                    },
                    response: <IHTTPResponseOptions>{
                        statusCode: {
                            pushTo: {
                                ctx: '$.response.code',
                            },
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
                    test: true,
                });
            },
        );
    }

    @test()
    async saveResponseToFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);

        await JSONTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const file = await tempPathRegistry.createTempFile();

                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/json',
                        method: method,
                    },
                    response: <IHTTPResponseOptions>{
                        body: {
                            saveTo: basename(file),
                        },
                    },
                };

                const context = ContextUtil.generateEmptyContext();
                const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(file), 0, {});

                const processor = actionHandler.getProcessor(options, context, snapshot, {});
                await processor.validate();
                await processor.execute();

                const body = await FSUtil.readYamlFromFile(file);
                assert.strictEqual(body.method, method);
            },
        );
    }

    @test()
    async bodyFromFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);
        const file = await tempPathRegistry.createTempFile(false, '.json');
        await promisify(writeFile)(file, JSON.stringify({ file: true }), 'utf8');

        await JSONTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/json',
                        method: method,
                        body: {
                            file: basename(file),
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
                const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(file), 0, {});

                const processor = actionHandler.getProcessor(options, context, snapshot, {});
                await processor.validate();
                await processor.execute();

                assert.strictEqual(context.ctx.response.code, 200);
                assert.deepStrictEqual(context.ctx.response.body.method, method);
                assert.deepStrictEqual(context.ctx.response.body.body, {
                    file: true,
                });
            },
        );
    }

    @test()
    async bodyFromTemplateFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);
        const file = await tempPathRegistry.createTempFile(false, '.json');
        await promisify(writeFile)(file, JSON.stringify({ file: '<%- ctx.test %>' }), 'utf8');

        await JSONTestSuite.forEachAction(
            async (
                actionHandler: ActionHandler,
                method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
            ): Promise<void> => {
                const options = {
                    request: <IHTTPRequestOptions>{
                        url: DummyServerWrapper.ENDPOINT + '/json',
                        method: method,
                        body: {
                            file: {
                                path: basename(file),
                                template: true,
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
                context.ctx.test = 'yes';
                const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(file), 0, {});

                const processor = actionHandler.getProcessor(options, context, snapshot, {});
                await processor.validate();
                await processor.execute();

                assert.strictEqual(context.ctx.response.code, 200);
                assert.deepStrictEqual(context.ctx.response.body.method, method);
                assert.deepStrictEqual(context.ctx.response.body.body, {
                    file: 'yes',
                });
            },
        );
    }
}
