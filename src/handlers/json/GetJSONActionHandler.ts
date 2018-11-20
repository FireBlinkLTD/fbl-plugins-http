import {IActionHandlerMetadata} from 'fbl/dist/src/interfaces';
import {BaseJsonActionHandler} from './BaseJsonActionHandler';
import {GotFn, get} from 'got';

export class GetJSONActionHandler extends BaseJsonActionHandler {
    private static metadata = <IActionHandlerMetadata> {
        id: 'com.fireblink.fbl.plugins.http.get.json',
        aliases: [
            'fbl.plugins.http.get.json',
            'plugins.http.get.json',
            'http.get.json',
            'get.json',
        ]
    };

    /* istanbul ignore next */
    getMetadata(): IActionHandlerMetadata {
        return GetJSONActionHandler.metadata;
    }

    gotFn(): GotFn {
        return get;
    }
}