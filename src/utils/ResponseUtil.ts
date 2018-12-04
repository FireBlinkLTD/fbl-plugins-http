import {ContextUtil} from 'fbl/dist/src/utils';
import {IContext, IDelegatedParameters} from 'fbl/dist/src/interfaces';
import {ActionSnapshot} from 'fbl/dist/src/models';
import { IAssignTo, IPushTo } from '../interfaces';


interface IAssignContextConfig {
    assignTo?: IAssignTo | string;
    pushTo?: IPushTo | string;
}

export class ResponseUtil {
    static async assign(
        config: IAssignContextConfig,
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        value: any
    ): Promise<void> {
        if (config) {
            await ResponseUtil.assignTo(
                config.assignTo,
                context,
                snapshot,
                parameters,
                value
            );

            await ResponseUtil.pushTo(
                config.pushTo,
                context,
                snapshot,
                parameters,
                value
            );
        }
    }

    static async assignTo(
        config: IAssignTo | string,
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        value: any
    ) {
        if (value !== undefined && config) {
            let override = false;

            if (typeof config !== 'string') {
                override = config.override;
            }

            await ContextUtil.assignTo(
                context,
                parameters,
                snapshot,
                config,
                value,
                override
            );
        }
    }

    static async pushTo(
        config: IPushTo | string,
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        value: any
    ) {
        if (value !== undefined && config) {
            let override = false;
            let children = false;

            if (typeof config !== 'string') {
                override = config.override;
                children = config.children;
            }

            await ContextUtil.pushTo(
                context,
                parameters,
                snapshot,
                config,
                value,
                children,
                override
            );
        }
    }
}
