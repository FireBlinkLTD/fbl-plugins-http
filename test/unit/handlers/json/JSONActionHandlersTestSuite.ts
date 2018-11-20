import {suite, test} from 'mocha-typescript';
import {Container} from 'typedi';
import {DummyServerWrapper} from '../../../assets/dummy.http.server.wrapper';
import {
    DeleteJSONActionHandler,
    GetJSONActionHandler,
    PatchJSONActionHandler,
    PostJSONActionHandler, PutJSONActionHandler
} from '../../../../src/handlers/json';
import {ContextUtil, FSUtil} from 'fbl/dist/src/utils';
import {ActionHandler, ActionSnapshot} from 'fbl/dist/src/models';
import * as assert from 'assert';
import {TempPathsRegistry} from 'fbl/dist/src/services';
import {basename, dirname} from 'path';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

@suite()
class JSONActionHandlersTestSuite {
    async after(): Promise<void> {
        Container.reset();
    }

    private static async forEachAction(fn: Function): Promise<void> {
        const handlers = [
            {
                handler: new DeleteJSONActionHandler(),
                type: 'DELETE'
            },
            {
                handler: new GetJSONActionHandler(),
                type: 'GET'
            },
            {
                handler: new PatchJSONActionHandler(),
                type: 'PATCH'
            },
            {
                handler: new PostJSONActionHandler(),
                type: 'POST'
            },
            {
                handler: new PutJSONActionHandler(),
                type: 'PUT'
            }
        ];

        await Promise.all(handlers.map(async (it: any): Promise<void> => {
            return await fn(it.handler, it.type);
        }))
    }

    @test()
    async assignResponseTo(): Promise<void> {
        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/json',
                query: {
                    test: 'yes'
                },
                headers: {
                    'X-Test': '1234'
                },
                body: {
                    inline: {
                        test: true
                    }
                }
            },
            response: {
                statusCode: {
                    assignTo: {
                        ctx: '$.response.code'
                    }
                },

                body: {
                    assignTo: {
                        ctx: '$.response.body'
                    }
                }
            }
        };

        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, type: string): Promise<void> => {
            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});

            assert.strictEqual(context.ctx.response.code, 200);
            assert.deepStrictEqual(context.ctx.response.body.type, type);
            assert.deepStrictEqual(context.ctx.response.body.query, options.request.query);
            assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
        });
    }

    @test()
    async pushResponseTo(): Promise<void> {
        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/json',
                query: {
                    test: 'yes'
                },
                headers: {
                    'X-Test': '1234'
                },
                body: {
                    inline: {
                        test: true
                    }
                }
            },
            response: {
                statusCode: {
                    pushTo: {
                        ctx: '$.response.code'
                    }
                },

                body: {
                    pushTo: {
                        ctx: '$.response.body'
                    }
                }
            }
        };

        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, type: string): Promise<void> => {
            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

            await actionHandler.validate(options, context, snapshot, {});
            await actionHandler.execute(options, context, snapshot, {});

            assert.deepStrictEqual(context.ctx.response.code, [200]);
            assert.deepStrictEqual(context.ctx.response.body[0].type, type);
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

        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, type: string): Promise<void> => {
            const file = await tempPathRegistry.createTempFile();

            const options = {
                request: {
                    url: DummyServerWrapper.ENDPOINT + '/json'
                },
                response: {
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
            assert.strictEqual(body.type, type);
        });
    }

    @test()
    async failValidationOnMissingBodyFile(): Promise<void> {
        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, type: string): Promise<void> => {
            const options = {
                request: {
                    url: DummyServerWrapper.ENDPOINT + '/json',
                    body: {
                        file: 'missing_body.file'
                    }
                }
            };

            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, __dirname, 0, {});

            await chai.expect(
                actionHandler.validate(options, context, snapshot, {})
            ).to.be.rejectedWith(
                `Unable to locate body payload file at path: ${FSUtil.getAbsolutePath(options.request.body.file, __dirname)}`
            );
        });
    }

    @test()
    async failValidationOnUploadFileOption(): Promise<void> {
        await JSONActionHandlersTestSuite.forEachAction(async (actionHandler: ActionHandler, type: string): Promise<void> => {
            const options = {
                request: {
                    url: DummyServerWrapper.ENDPOINT + '/json',
                    body: {
                        file: 'file.json',
                        upload: true
                    }
                }
            };

            const context = ContextUtil.generateEmptyContext();
            const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

            await chai.expect(
                actionHandler.validate(options, context, snapshot, {})
            ).to.be.rejectedWith(
                'request.body.upload parameter is not allowed for JSON requests'
            );
        });
    }
}