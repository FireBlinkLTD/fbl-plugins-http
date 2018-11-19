import {suite, test} from 'mocha-typescript';
import {Container} from 'typedi';
import {DummyServerWrapper} from '../../../assets/dummy.http.server.wrapper';
import {GetJSONActionHandler} from '../../../../src/handlers/json';
import {FBL_ASSIGN_TO_SCHEMA, FBL_PUSH_TO_SCHEMA} from 'fbl/dist/src/schemas';
import * as Joi from 'joi';
import {ContextUtil} from 'fbl/dist/src/utils';
import {ActionSnapshot} from 'fbl/dist/src/models';
import * as assert from 'assert';

@suite()
class GetJSONActionHandlerTestSuite {
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
}