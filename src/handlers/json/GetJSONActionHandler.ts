import {BaseJsonActionHandler} from './BaseJsonActionHandler';
import {GotFn, get} from 'got';

export class GetJSONActionHandler extends BaseJsonActionHandler {
    name(): string {
        return 'get'
    }

    gotFn(): GotFn {
        return get;
    }
}