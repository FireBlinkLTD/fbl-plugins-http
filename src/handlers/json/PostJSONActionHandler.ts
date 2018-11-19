import {IActionHandlerMetadata} from 'fbl/dist/src/interfaces';
import {BaseJsonActionHandler} from './BaseJsonActionHandler';
import {GotFn, get} from 'got';

export class PostJSONActionHandler extends BaseJsonActionHandler {
    private static metadata = <IActionHandlerMetadata> {
        id: 'com.fireblink.fbl.plugins.http.post.json',
        aliases: [
            'fbl.plugins.http.post.json',
            'plugins.http.post.json',
            'http.post.json',
            'post.json',
        ]
    };

    getMetadata(): IActionHandlerMetadata {
        return PostJSONActionHandler.metadata;
    }

    gotFn(): GotFn {
        return get;
    }
}