import {suite, test} from 'mocha-typescript';
import { RandomUserAgentTemplateUtility } from '../../src/templateUtilities/RandomUserAgentTemplateUtility';
import { ContextUtil, ActionSnapshot } from 'fbl';
import * as assert from 'assert';

@suite()
class RandomUserAgentTemplateUtilityTestSuite {
    @test()
    async generateRandomUserAgent(): Promise<void> {
        const fn = new RandomUserAgentTemplateUtility().getUtilities(
            ContextUtil.generateEmptyContext(),
            new ActionSnapshot('', {}, '.', 0, {}),
            {}
        ).http.randomUserAgent;

        const withoutFilters = fn();
        assert.strictEqual(typeof withoutFilters, 'string');
        assert(withoutFilters.length > 0);

        const withFilter = fn(/Safari/);
        assert.strictEqual(typeof withFilter, 'string');
        assert(withFilter.indexOf('Safari') >= 0);
    }
}
