import * as fblInterfaces from 'fbl/dist/src/interfaces';

export interface IAssignTo extends fblInterfaces.IAssignTo {
    as: 'base64' | 'hex' | 'utf8' | 'json';
}
