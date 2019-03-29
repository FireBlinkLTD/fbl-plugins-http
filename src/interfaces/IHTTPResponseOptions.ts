import { IAssignTo } from './IAssignTo';
import { IPushTo } from './IPushTo';

export interface IHTTPResponseOptions {
    statusCode?: {
        assignTo?: IAssignTo | string;
        pushTo?: IPushTo | string;
    };

    headers?: {
        assignTo?: IAssignTo | string;
        pushTo?: IPushTo | string;
    };

    body?: {
        assignTo?: IAssignTo | string;
        pushTo?: IPushTo | string;
        saveTo?: string;
    };
}
