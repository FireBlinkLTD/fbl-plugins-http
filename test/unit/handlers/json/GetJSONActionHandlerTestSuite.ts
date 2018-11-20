import {suite, test} from 'mocha-typescript';
import {Container} from 'typedi';
import {DummyServerWrapper} from '../../../assets/dummy.http.server.wrapper';
import {GetJSONActionHandler} from '../../../../src/handlers/json';
import {ContextUtil, FSUtil} from 'fbl/dist/src/utils';
import {ActionSnapshot} from 'fbl/dist/src/models';
import * as assert from 'assert';
import {TempPathsRegistry} from 'fbl/dist/src/services';
import {basename, dirname} from 'path';

@suite()
class GetJSONActionHandlerTestSuite {
    async after(): Promise<void> {
        Container.reset();
    }

    @test()
    async makeRequest(): Promise<void> {
        const actionHandler = new GetJSONActionHandler();
        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/json',
                query: {
                    test: 'yes'
                },
                headers: {
                    'X-Test': '1234'
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

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

        await actionHandler.validate(options, context, snapshot, {});
        await actionHandler.execute(options, context, snapshot, {});

        assert.strictEqual(context.ctx.response.code, 200);
        assert.deepStrictEqual(context.ctx.response.body.type, 'GET');
        assert.deepStrictEqual(context.ctx.response.body.query, options.request.query);
        assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
    }

    @test()
    async pushToContext(): Promise<void> {
        const actionHandler = new GetJSONActionHandler();
        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/json',
                query: {
                    test: 'yes'
                },
                headers: {
                    'X-Test': '1234'
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

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

        await actionHandler.validate(options, context, snapshot, {});
        await actionHandler.execute(options, context, snapshot, {});

        assert.deepStrictEqual(context.ctx.response.code, [200]);
        assert.deepStrictEqual(context.ctx.response.body[0].type, 'GET');
        assert.deepStrictEqual(context.ctx.response.body[0].query, options.request.query);
        assert.strictEqual(context.ctx.response.body[0].headers['x-test'], '1234');
    }

    @test()
    async saveResponseToFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);
        const file = await tempPathRegistry.createTempFile();

        const actionHandler = new GetJSONActionHandler();
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
        assert.strictEqual(body.type, 'GET');
    }
}