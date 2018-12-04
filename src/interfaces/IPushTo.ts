import * as fblInterfaces from 'fbl/dist/src/interfaces';

export interface IPushTo extends fblInterfaces.IPushTo {
    as: 'base64' | 'hex' | 'utf8' | 'json';
}
