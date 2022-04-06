import { expect, test } from '@jest/globals';
import {
    AddRule,
    getPotentialRules,
    getRule,
    getRules,
    removeRule,
    ruleBranchCopy,
    ruleBranchFromRules,
    RuleLeaf,
} from './potential_rules';

test('rulebranch_from_rules', () => {
    const r0 = new RuleLeaf(
        'a',
        new Map<string, string>([
            ['x', 'x0'],
            ['z', 'z0'],
        ]),
        1,
        new Map<string, string>(),
    );
    const r1 = new RuleLeaf(
        'b',
        new Map<string, string>([
            ['x', 'x0'],
            ['y', 'y0'],
        ]),
        2,
        new Map<string, string>(),
    );
    const r2 = new RuleLeaf('c', new Map<string, string>([['z', 'z0']]), 3, new Map<string, string>());
    const rdefault = RuleLeaf.defaultRule('def');
    const rb = ruleBranchFromRules([r0, r1, r2, rdefault], ['x', 'y', 'z']);
    expect(rb).toEqual(
        new Map([
            [
                'x0',
                new Map([
                    ['y0', new Map([['*', r1]])],
                    ['*', new Map([['z0', r0]])],
                ]),
            ],
            [
                '*',
                new Map([
                    [
                        '*',
                        new Map([
                            ['z0', r2],
                            ['*', rdefault],
                        ]),
                    ],
                ]),
            ],
        ]),
    );

    expect(getRules(rb)).toEqual([r0, r1, r2, rdefault]);
    expect(
        getRule(
            rb,
            new Map([
                ['x', 'x0'],
                ['y', 'y0'],
                ['z', 'z0'],
            ]),
            ['x', 'y', 'z'],
        ),
    ).toEqual(null);
    expect(getRule(rb, new Map([['z', 'z0']]), ['x', 'y', 'z'])).toEqual(r2);

    const rb2 = ruleBranchFromRules([r0, r1, rdefault], ['x', 'y', 'z']);
    expect(getRules(rb2)).toEqual([r0, r1, rdefault]);
    const rb3 = ruleBranchCopy(rb);
    expect(rb3).toEqual(rb);
    removeRule(rb3, r2, ['x', 'y', 'z']);
    expect(rb2).toEqual(rb3);
    AddRule(rb3, r2, ['x', 'y', 'z']); // copy is shallow oops
    AddRule(rb2, r2, ['x', 'y', 'z']);
    expect(rb2).toEqual(rb);
});

test('getpotentialrules', () => {
    const r0 = new RuleLeaf(
        'a',
        new Map<string, string>([
            ['x', 'x0'],
            ['z', 'z0'],
        ]),
        1,
        new Map<string, string>(),
    );
    const r1 = new RuleLeaf(
        'b',
        new Map<string, string>([
            ['x', 'x0'],
            ['y', 'y0'],
        ]),
        2,
        new Map<string, string>(),
    );
    const r2 = new RuleLeaf('c', new Map<string, string>([['z', 'z0']]), 3, new Map<string, string>());
    const rdefault = RuleLeaf.defaultRule('def');
    const rb = ruleBranchFromRules([r0, r1, r2, rdefault], ['x', 'y', 'z']);

    expect(getPotentialRules(rb, ['x', 'y', 'z'], new Map(), () => true).map((p) => p.rule)).toEqual([
        r0,
        r2,
        r1,
        rdefault,
    ]);

    expect(getPotentialRules(rb, ['x', 'y', 'z'], new Map([['x', 'x0']]), () => true).map((p) => p.rule)).toEqual([
        r0,
        r1,
        rdefault,
    ]);
});
