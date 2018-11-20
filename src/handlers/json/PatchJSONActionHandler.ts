import {BaseJsonActionHandler} from './BaseJsonActionHandler';
import {GotFn, patch} from 'got';

export class PatchJSONActionHandler extends BaseJsonActionHandler {
    name(): string {
        return 'patch'
    }

    gotFn(): GotFn {
        return patch;
    }
}