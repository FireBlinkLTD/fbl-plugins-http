import {suite, test} from 'mocha-typescript';
import {Container} from 'typedi';
import {DummyServerWrapper} from '../../../assets/dummy.http.server.wrapper';
import {PostJSONActionHandler} from '../../../../src/handlers/json';
import {ContextUtil} from 'fbl/dist/src/utils';
import {ActionSnapshot} from 'fbl/dist/src/models';
import * as assert from 'assert';

@suite()
class PostJSONActionHandlerTestSuite {
    private dummyServerWrapper: DummyServerWrapper;

    async after(): Promise<void> {
        Container.reset();

        if (this.dummyServerWrapper) {
            await this.dummyServerWrapper.stop();
        }
        this.dummyServerWrapper = undefined;
    }

    @test()
    async makeRequest(): Promise<void> {
        this.dummyServerWrapper = new DummyServerWrapper();
        await this.dummyServerWrapper.start();

        const actionHandler = new PostJSONActionHandler();
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

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

        await actionHandler.validate(options, context, snapshot, {});
        await actionHandler.execute(options, context, snapshot, {});

        assert.strictEqual(context.ctx.response.code, 200);
        assert.deepStrictEqual(context.ctx.response.body.type, 'POST');
        assert.deepStrictEqual(context.ctx.response.body.query, options.request.query);
        assert.strictEqual(context.ctx.response.body.headers['x-test'], '1234');
        assert.deepStrictEqual(context.ctx.response.body.body, {
            test: true
        });
    }
}