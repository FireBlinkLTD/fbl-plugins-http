import { 
    ITemplateUtility, 
    IContext, 
    IDelegatedParameters, 
    ActionSnapshot
} from 'fbl/dist/src';

const UserAgent = require('user-agents');

export class RandomUserAgentTemplateUtility implements ITemplateUtility {
    /**
     * @inheritdoc
     */
    getUtilities(context: IContext, snapshot: ActionSnapshot, parameters: IDelegatedParameters): {[key: string]: any} {
        return {
            http: {
                randomUserAgent: (filters?: any): string => {
                    const userAgent = new UserAgent(filters);

                    return userAgent.toString();
                }
            }
        };
    }
}
