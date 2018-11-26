import {ContextUtil} from 'fbl/dist/src/utils';
import {IContext, IDelegatedParameters} from 'fbl/dist/src/interfaces';
import {ActionSnapshot} from 'fbl/dist/src/models';

interface IAssignToContextConfig {
    ctx?: string;
    secrets?: string;
    parameters?: string;
    override?: boolean;
}

interface IPushToContextConfig extends IAssignToContextConfig {
    children?: boolean;
}


interface IAssignContextConfig {
    assignTo?: IAssignToContextConfig;
    pushTo?: IPushToContextConfig;
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
        config: IAssignToContextConfig,
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        value: any
    ) {
        if (value !== undefined && config) {
            await ContextUtil.assignTo(
                context,
                parameters,
                snapshot,
                config,
                value,
                config.override
            );
        }
    }

    static async pushTo(
        config: IPushToContextConfig,
        context: IContext,
        snapshot: ActionSnapshot,
        parameters: IDelegatedParameters,
        value: any
    ) {
        if (value !== undefined && config) {
            await ContextUtil.pushTo(
                context,
                parameters,
                snapshot,
                config,
                value,
                config.children,
                config.override
            );
        }
    }
}
