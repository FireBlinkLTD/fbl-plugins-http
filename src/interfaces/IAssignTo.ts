import * as fbl from 'fbl';

export interface IAssignTo extends fbl.IAssignTo {
    as: 'base64' | 'hex' | 'utf8' | 'json';
}
