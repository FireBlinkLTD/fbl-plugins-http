import {BaseJsonActionHandler} from './BaseJsonActionHandler';
import {GotFn, put} from 'got';

export class PutJSONActionHandler extends BaseJsonActionHandler {
    name(): string {
        return 'put'
    }

    gotFn(): GotFn {
        return put;
    }
}