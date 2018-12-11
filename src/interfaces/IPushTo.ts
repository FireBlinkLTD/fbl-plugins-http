import * as fbl from 'fbl';

export interface IPushTo extends fbl.IPushTo {
    as: 'base64' | 'hex' | 'utf8' | 'json';
}
