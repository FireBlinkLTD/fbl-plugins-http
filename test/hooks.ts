import * as colors from 'colors';
import {DummyServerWrapper} from './assets/dummy.http.server.wrapper';

let dummyServerWrapper: DummyServerWrapper;

before(async (): Promise<void> => {
    colors.enable();

    dummyServerWrapper = new DummyServerWrapper();
    await dummyServerWrapper.start();
});

after(async (): Promise<void> => {
    if (dummyServerWrapper) {
        await dummyServerWrapper.stop();
    }
    dummyServerWrapper = undefined;
});
