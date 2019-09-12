import { ActionSnapshot, ContextUtil, FSUtil, TempPathsRegistry } from 'fbl';
import { suite, test } from 'mocha-typescript';
import { DummyServerWrapper } from '../assets/dummy.http.server.wrapper';
import { Container } from 'typedi';
import { basename, dirname } from 'path';
import * as assert from 'assert';
import { HTTPRequestActionHandler } from '../../src/handlers';
import { IHTTPRequestOptions, IHTTPResponseOptions } from '../../src/interfaces';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

@suite()
class FileDownloadTestSuite {
    @test()
    async downloadFile(): Promise<void> {
        const targetFile = await Container.get(TempPathsRegistry).createTempFile();

        const options = {
            request: {
                url: DummyServerWrapper.ENDPOINT + '/static/file.txt',
                method: 'GET',
                query: {
                    test: 'yes',
                },
                headers: {
                    'X-Test': '1234',
                },
            },
            response: {
                statusCode: {
                    assignTo: {
                        ctx: '$.response.code',
                    },
                },

                headers: {
                    assignTo: {
                        ctx: '$.response.headers',
                    },
                },

                body: {
                    assignTo: '$.ctx.assigned',
                    pushTo: {
                        ctx: '$.pushed',
                        as: 'hex',
                    },
                    saveTo: basename(targetFile),
                },
            },
        };

        const actionHandler = new HTTPRequestActionHandler();

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(
            'index.yml',
            actionHandler.getMetadata().id,
            {},
            dirname(targetFile),
            0,
            {},
        );

        const processor = actionHandler.getProcessor(options, context, snapshot, {});
        await processor.validate();
        await processor.execute();

        assert.strictEqual(context.ctx.response.code, 200);

        const request = JSON.parse(context.ctx.response.headers['x-request']);

        assert.deepStrictEqual(request.query, options.request.query);
        assert.strictEqual(request.headers['x-test'], '1234');

        const actual = await FSUtil.readTextFile(targetFile);
        const expected = await FSUtil.readTextFile('test/assets/server/static/file.txt');
        assert.strictEqual(actual, expected);
        assert.strictEqual(context.ctx.assigned, new Buffer(expected).toString('base64'));
        assert.deepStrictEqual(context.ctx.pushed, [new Buffer(expected).toString('hex')]);
    }

    @test()
    async downloadFileToContext(): Promise<void> {
        const options = {
            request: <IHTTPRequestOptions>{
                url: DummyServerWrapper.ENDPOINT + '/static/file.txt',
                method: 'GET',
            },
            response: <IHTTPResponseOptions>{
                body: {
                    assignTo: {
                        ctx: '$.response.body',
                        as: 'utf8',
                    },

                    pushTo: {
                        ctx: '$.response.body[]',
                        as: 'utf8',
                    },
                },
            },
        };

        const actionHandler = new HTTPRequestActionHandler();

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot('index.yml', actionHandler.getMetadata().id, {}, '.', 0, {});

        const processor = actionHandler.getProcessor(options, context, snapshot, {});
        await processor.validate();
        await processor.execute();

        const expected = await FSUtil.readTextFile('test/assets/server/static/file.txt');
        assert.strictEqual(context.ctx.response.body, expected);
        assert.strictEqual(context.ctx.response['body[]'][0], expected);
    }

    @test()
    async failOn404() {
        const targetFile = await Container.get(TempPathsRegistry).createTempFile();

        const options = {
            request: <IHTTPRequestOptions>{
                url: DummyServerWrapper.ENDPOINT + '/static/missing.txt',
                method: 'GET',
                query: {
                    test: 'yes',
                },
                headers: {
                    'X-Test': '1234',
                },
            },
            response: <IHTTPResponseOptions>{
                statusCode: {
                    assignTo: '$.ctx.response.code',
                },

                headers: {
                    assignTo: {
                        ctx: '$.response.headers',
                    },
                },

                body: {
                    saveTo: basename(targetFile),
                },
            },
        };

        const actionHandler = new HTTPRequestActionHandler();

        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot(
            'index.yml',
            actionHandler.getMetadata().id,
            {},
            dirname(targetFile),
            0,
            {},
        );

        const processor = actionHandler.getProcessor(options, context, snapshot, {});
        await processor.validate();
        await chai.expect(processor.execute()).to.be.rejected;

        assert.strictEqual(context.ctx.response.code, 404);

        const request = JSON.parse(context.ctx.response.headers['x-request']);

        assert.deepStrictEqual(request.query, options.request.query);
        assert.strictEqual(request.headers['x-test'], '1234');
    }
}
