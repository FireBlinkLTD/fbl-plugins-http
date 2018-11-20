import {BaseJsonActionHandler} from './BaseJsonActionHandler';
import * as got from 'got';

export class DeleteJSONActionHandler extends BaseJsonActionHandler {
    name(): string {
        return 'delete'
    }

    gotFn(): got.GotFn {
        return got.delete;
    }
}