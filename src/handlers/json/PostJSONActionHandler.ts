import {BaseJsonActionHandler} from './BaseJsonActionHandler';
import {GotFn, post} from 'got';

export class PostJSONActionHandler extends BaseJsonActionHandler {
    name(): string {
        return 'post';
    }

    gotFn(): GotFn {
        return post;
    }
}
