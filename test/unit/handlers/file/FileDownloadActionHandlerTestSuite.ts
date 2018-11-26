import {suite, test} from 'mocha-typescript';
import {DummyServerWrapper} from '../../../assets/dummy.http.server.wrapper';
import {Container} from 'typedi';
import {TempPathsRegistry} from 'fbl/dist/src/services';
import {basename, dirname, resolve} from 'path';
import {ContextUtil, FSUtil} from 'fbl/dist/src/utils';
import {ActionSnapshot} from 'fbl/dist/src/models';
import * as assert from 'assert';
import {FileDownloadActionHandler} from '../../../../src/handlers/file';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

@suite()
class FileDownloadActionHandlerTestSuite {

    @test()
    async downloadFile(): Promise<void> {
        const targetFile = await Container.get(TempPathsRegistry).createTempFile();

        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/static/file.txt',
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

                headers: {
                    assignTo: {
                        ctx: '$.response.headers'
                    }
                },

                body: {
                    saveTo: basename(targetFile)
                }
            }
        };

        const actionHandler = new FileDownloadActionHandler();

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(targetFile), 0, {});

        await actionHandler.validate(options, context, snapshot, {});
        await actionHandler.execute(options, context, snapshot, {});

        assert.strictEqual(context.ctx.response.code, 200);

        const request = JSON.parse(context.ctx.response.headers['x-request']);

        assert.deepStrictEqual(request.query, options.request.query);
        assert.strictEqual(request.headers['x-test'], '1234');

        const actual = await FSUtil.readTextFile(targetFile);
        const expected = await FSUtil.readTextFile(resolve(__dirname, '../../../../../test/assets/server/static/file.txt'));
        assert.strictEqual(actual, expected);
    }

    @test()
    async downloadFileToContext(): Promise<void> {
        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/static/file.txt'
            },
            response: {
                body: {
                    assignTo: {
                        ctx: '$.response.body',
                        encoding: 'utf8'
                    },

                    pushTo: {
                        ctx: '$.response.body[]',
                        encoding: 'utf8'
                    },
                }
            }
        };

        const actionHandler = new FileDownloadActionHandler();

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

        await actionHandler.validate(options, context, snapshot, {});
        await actionHandler.execute(options, context, snapshot, {});

        const expected = await FSUtil.readTextFile(resolve(__dirname, '../../../../../test/assets/server/static/file.txt'));
        assert.strictEqual(context.ctx.response.body, expected);
        assert.strictEqual(context.ctx.response['body[]'][0], expected);
    }

    @test()
    async failOnRequestBody(): Promise<void> {
        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/static/file.txt',
                body: {
                    inline: {
                        test: true
                    }
                }
            },
            response: {
                body: {
                    saveTo: 'file.txt'
                }
            }
        };

        const actionHandler = new FileDownloadActionHandler();

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, '.', 0, {});

        await chai.expect(
            actionHandler.validate(options, context, snapshot, {})
        ).to.be.rejectedWith('request.body configuration is not allowed for file download requests');
    }

    @test()
    async failOn404() {
        const targetFile = await Container.get(TempPathsRegistry).createTempFile();

        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/static/missing.txt',
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

                headers: {
                    assignTo: {
                        ctx: '$.response.headers'
                    }
                },

                body: {
                    saveTo: basename(targetFile)
                }
            }
        };

        const actionHandler = new FileDownloadActionHandler();

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(actionHandler.getMetadata().id, {}, dirname(targetFile), 0, {});

        await actionHandler.validate(options, context, snapshot, {});
        await chai.expect(
            actionHandler.execute(options, context, snapshot, {})
        ).to.be.rejected;

        assert.strictEqual(context.ctx.response.code, 404);

        const request = JSON.parse(context.ctx.response.headers['x-request']);

        assert.deepStrictEqual(request.query, options.request.query);
        assert.strictEqual(request.headers['x-test'], '1234');
    }
}
