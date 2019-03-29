import { ActionSnapshot, ContextUtil, TempPathsRegistry } from 'fbl';
import { suite, test } from 'mocha-typescript';
import { HTTPRequestActionHandler } from '../../src/handlers';
import { IHTTPRequestOptions } from '../../src/interfaces';
import { Container } from 'typedi';
import { dirname, basename } from 'path';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

@suite()
class OptionsValidationTestSuite {
    async after(): Promise<void> {
        Container.reset();
    }

    @test()
    async failJoiValidation() {
        const actionHandler = new HTTPRequestActionHandler();
        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot('.', {}, '', 0, {});

        await chai.expect(actionHandler.getProcessor([], context, snapshot, {}).validate()).to.be.rejected;

        await chai.expect(actionHandler.getProcessor({}, context, snapshot, {}).validate()).to.be.rejected;

        await chai.expect(
            actionHandler
                .getProcessor(
                    {
                        request: {},
                    },
                    context,
                    snapshot,
                    {},
                )
                .validate(),
        ).to.be.rejected;

        await chai.expect(
            actionHandler
                .getProcessor(
                    {
                        request: {
                            url: 'test',
                        },
                    },
                    context,
                    snapshot,
                    {},
                )
                .validate(),
        ).to.be.rejected;

        await chai.expect(
            actionHandler
                .getProcessor(
                    {
                        request: {
                            url: 'http://fireblink.com',
                            method: 'UNKNOWN',
                        },
                    },
                    context,
                    snapshot,
                    {},
                )
                .validate(),
        ).to.be.rejected;

        await chai.expect(
            actionHandler
                .getProcessor(
                    {
                        request: {
                            url: 'fireblink.com',
                            method: 'GET',
                        },
                    },
                    context,
                    snapshot,
                    {},
                )
                .validate(),
        ).to.be.rejected;
    }

    @test()
    async passJoiValidation() {
        const actionHandler = new HTTPRequestActionHandler();
        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot('.', {}, '', 0, {});

        await actionHandler
            .getProcessor(
                {
                    request: {
                        url: 'http://fireblink.com',
                        method: 'GET',
                    },
                },
                context,
                snapshot,
                {},
            )
            .validate();
    }

    @test()
    async failFileValidation() {
        const actionHandler = new HTTPRequestActionHandler();
        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot('.', {}, '', 0, {});

        await chai.expect(
            actionHandler
                .getProcessor(
                    {
                        request: <IHTTPRequestOptions>{
                            url: 'http://fireblink.com',
                            method: 'GET',
                            body: {
                                file: 'missing_file.txt',
                            },
                        },
                    },
                    context,
                    snapshot,
                    {},
                )
                .validate(),
        ).to.be.rejected;

        await chai.expect(
            actionHandler
                .getProcessor(
                    {
                        request: <IHTTPRequestOptions>{
                            url: 'http://fireblink.com',
                            method: 'GET',
                            body: {
                                form: {
                                    files: {
                                        test: 'missing_file.txt',
                                    },
                                },
                            },
                        },
                    },
                    context,
                    snapshot,
                    {},
                )
                .validate(),
        ).to.be.rejected;
    }

    @test()
    async passFileValidation() {
        const tempPathsRegistry = Container.get(TempPathsRegistry);
        const file = await tempPathsRegistry.createTempFile();

        const actionHandler = new HTTPRequestActionHandler();
        const context = ContextUtil.generateEmptyContext();
        const snapshot = new ActionSnapshot('.', {}, dirname(file), 0, {});

        await actionHandler
            .getProcessor(
                {
                    request: <IHTTPRequestOptions>{
                        url: 'http://fireblink.com',
                        method: 'GET',
                        body: {
                            file: basename(file),
                        },
                    },
                },
                context,
                snapshot,
                {},
            )
            .validate();

        await actionHandler
            .getProcessor(
                {
                    request: <IHTTPRequestOptions>{
                        url: 'http://fireblink.com',
                        method: 'GET',
                        body: {
                            form: {
                                multipart: {
                                    files: {
                                        test: basename(file),
                                    },
                                },
                            },
                        },
                    },
                },
                context,
                snapshot,
                {},
            )
            .validate();
    }
}
