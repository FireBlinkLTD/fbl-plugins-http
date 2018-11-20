import {suite, test} from 'mocha-typescript';
import {Container} from 'typedi';
import {DummyServerWrapper} from '../../../assets/dummy.http.server.wrapper';
import {PostJSONActionHandler} from '../../../../src/handlers/json';
import {ContextUtil, FSUtil} from 'fbl/dist/src/utils';
import {ActionSnapshot} from 'fbl/dist/src/models';
import * as assert from 'assert';
import {TempPathsRegistry} from 'fbl/dist/src/services';
import {promisify} from 'util';
import {writeFile} from 'fs';
import {basename, dirname} from 'path';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.use(function (_chai: any, _: any) {
    _chai.Assertion.addMethod('withMessage', function (msg: string) {
        _.flag(this, 'message', msg);
    });
});


@suite()
class PostJSONActionHandlerTestSuite {
    async after(): Promise<void> {
        Container.reset();
    }

    @test()
    async makeRequest(): Promise<void> {
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

    @test()
    async bodyFromFile(): Promise<void> {
        const tempPathRegistry = Container.get(TempPathsRegistry);
        const file = await tempPathRegistry.createTempFile();
        await promisify(writeFile)(file, JSON.stringify({file: true}), 'utf8');

        const actionHandler = new PostJSONActionHandler();
        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/json',
                body: {
                    file: basename(file)
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
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(file), 0, {});

        await actionHandler.validate(options, context, snapshot, {});
        await actionHandler.execute(options, context, snapshot, {});

        assert.strictEqual(context.ctx.response.code, 200);
        assert.deepStrictEqual(context.ctx.response.body.type, 'POST');
        assert.deepStrictEqual(context.ctx.response.body.body, {
            file: true
        });
    }

    @test()
    async failValidationOnMissingBodyFile(): Promise<void> {
        const actionHandler = new PostJSONActionHandler();
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
    }

    @test()
    async failValidationOnUploadFileOption(): Promise<void> {
        const actionHandler = new PostJSONActionHandler();
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
    }
}