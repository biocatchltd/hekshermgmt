import {ModelGetRule, ModelRule} from "./index";

const exact_match = Symbol("e");
const wildcard = Symbol("w");
const presume_wildcard = Symbol("p(*)");
type ContextMatch = typeof exact_match | typeof wildcard | typeof presume_wildcard | string;

/*
Let's talk about rule matching for a minute:
our task is, given a partial context, and a list of rules, to find all the rules that could possibly match the contexts.
the partial context for each context feature can be one of:
1. set, in which case we know the value of the  context at this feature
2. unset, in which case we don't know which value will ultimately be set for this feature.
3. "<none>" which means that we don't match any exact-match rule for this feature. we can treat this as the first
 case but with a string that will never match a context value.

now when we apply this partial context to a rule, for each condition of a rule we can have one of the following
outcomes:
1. if the context feature is set:
    a. A Mismatch if the rule has an exact match condition for this feature, and for a different value then the one set.
     These rules will simply be filtered out at first sign and we will not concern ourselves with them. (this will also
     happen if there is a condition and we have set the partial feature to "<none>")
    b. An exact match if the rule has an exact match condition for this feature, and for the same value as the one set.
     We will mark these matches as "e" for exact.
    c. A wildcard match if the rule has a wildcard condition for this feature.
     We will mark these matches as "w" for wildcard.
2. if the context feature is unset (we denote this as "?"):
    a. a "presume" match if the rule has an exact match condition. In this case the rule is only applicable if the unset
     feature is presumed to be set to the condition's value. We will mark these matches as "p(<presumed value>)".
     (for example "p(production)")
    b. a "presume wildcard" if the rule has a wildcard condition. In this case the rule is always applicable, but never
     an exact match. We will mark these matches as "p(*)".

When a rule is matched, the match itself can be described as an array of these match kinds. For example, if a rule has
the condition (x: x0, y: *, z: z0), and the partial context is (x: x0, y: y0, z: ?), then the match is
["e", "w", "p(z0)"], since x matches exactly, y matches with a wildcard, and z only matches if it is presumed to be z0.

Note the following:
1. the match of a rule in a particular index is entirely dependant on the condition of the rule at that index, and the
 partial context at that index. As a consequence of this, for a given partial context, if two rule matches have the same
 value at an index, then their condition for that index must be the same.
2. only a set partial context can result in "e" or "w" matches, and only a set partial context can result in "p"
 matches. Therefore, for a given partial context, and two matches, and for any index, the values at the indices must
 either contain "e" or "w", or are both "p" matches.
3. we always add the default rule with match "e" for set features in partial context, and "p(*)" for unset, we will
 designate this rule as rule 0.

Now, given a set of rules and matches for a partial context, we need to define unreachable rules. A rule in a set of
rules and matches is "unreachable" if, for no completion of the partial context, will the rule be matched. Examples:

1. Given the rules A and B with conditions: (x: x0, y: *) and (x: x0, y: y0), and the partial context (x: ?, y: y0).
 Then, even though both rules match, A is unreachable, because it presumes x to be x0, but if it is x0, then b will
 supersede it.
2. Given the rules A and B with conditions: (x: *) and (x: x0), and the partial context (x: x0). Then, even though
 both rules match, A is unreachable, because rule b always supersedes it.
3. Given the rules A and B with conditions: (w: w0, x: x0, y: *) and (w: w1, x: x0, y: y0), and the partial context
 (w: ?, x: ?, y: y0). Then both rules match, and both are reachable, context (w: w0, x: x0, y:y0) will match A, and
 (w: w1, x: x0, y:y0) will match B. This is an example of why, when checking reachability, we must consider the context
 of the match

We can create a stronger relation here: We will define that match A is superseded by match B for a partial context if,
for any completion of the partial context that A matches, then rule B will also match, and supersede it. This relation
is a strict partial order over a group of matches for a partial context.

A rule is unreachable if it is not superseded by any rule in the group of matches.

We will check whether a rule A is superseded by a rule B by iterating pairwise over its matches. We will designate
the outcomes of the matches at index i as A[i] and B[i].
We will start with a variable "guard" that is initially set to 0. setting it to -1 indicates that A cannot be superseded
by B, and 1 indicates that B cannot be superseded by A. Attempting to set it to 1 when it is -1 or vice versa will
result in an incomparable result.

*. for set partial contexts:
    *. if A[i] is "e" and B[i] is "e", then neither rule supersedes the other yet, we continue.
    *. if A[i] is "w" and B[i] is "w", then neither rule supersedes the other yet, we continue.
    *. if A[i] is "e" and B[i] is "w", then rule A might supersede rule B. Rule A gets a tiebreaker advantage and
     continue.
*. for unset partial contexts
    *. if A[i] is "p(a)" and B[i] is "p(a)", then neither rule supersedes the other yet, we continue.
    *. if A[i] is "p(*)" and B[i] is "p(*)", then neither rule supersedes the other yet, we continue.
    *. if A[i] is "p(a)" and B[i] is "p(b)", then the rules are incomparable. Since there is now a completion of the
     partial context that only A matches, and another completion that only B matches.
    *. if A[i] is "p(*)" and B[i] is "p(b)", then while rule B will never supersede A (since we can complete the context
     so that A matches but B does not), rule A might supersede rule B. set the guard to 1 and continue. The tiebreaker
     advantage should also be reset (since it should be taken away from A if it exists, and giving it to B is
     meaningless since it is guarded).

If we end with a tiebreaker advantage, then the side with the advantage supersedes, unless the guard prevents it. If
there is no tiebreaker, then the rules are incomparable.

 */

type RuleMatch = {
    rule: RuleLeaf
    context_matches: ContextMatch[]
}

export class RuleLeaf {
    value: any
    context_features: Map<string, string>
    rule_id: number
    metadata: Map<string, any>

    constructor(model: ModelRule);
    constructor(model: ModelGetRule, id: number);
    constructor(model: any, id?: number) {
        this.value = model.value;
        this.metadata = new Map(Object.entries(model.metadata));

        if (id === undefined) {
            this.rule_id = model.rule_id;
            this.context_features = new Map(model.context_features);
        } else {
            this.rule_id = id;
            this.context_features = new Map(model.feature_values);
        }
    }
}

export class PotentialRule {
    rule: RuleLeaf
    assumptions: Map<string, string>

    constructor(match: RuleMatch, context_features: string[]) {
        this.rule = match.rule
        this.assumptions = new Map()
        for (let i in match.context_matches) {
            let match_element = match.context_matches[i]
            let cf = context_features[i]
            if (match_element === presume_wildcard) {
                this.assumptions.set(cf, '*')
            } else if (typeof match_element === 'string') {
                this.assumptions.set(cf, match_element)
            }
        }
    }

    get_assumptions_string(): string {
        return Array.from(this.assumptions.entries()).map(([cf, value]) => `${cf}: ${value}`).join(', ')
    }
}

export type RuleBranch = Map<string, RuleLeaf> | Map<string, RuleBranch>  // the key "*" specified wildcard

export function ruleBranchFromRules(rules: RuleLeaf[], configurable_features: string[], depth: number = 0): RuleBranch {
    let cf = configurable_features[depth];
    let ret: RuleBranch = new Map()
    if (depth == configurable_features.length - 1) {
        // we are at the bottom of the tree, add direct rules
        for (let rule of rules) {
            // @ts-ignore
            ret.set(rule.context_features.get(cf) ?? "*", rule);
        }
        return ret;
    } else {
        // recurse
        let children: Record<string, RuleLeaf[]> = {}
        for (let rule of rules) {
            let value = rule.context_features.get(cf) ?? "*";
            if (!(value in children)) {
                children[value] = []
            }
            children[value].push(rule)
        }
        for (let value in children) {
            // @ts-ignore
            ret.set(value, ruleBranchFromRules(children[value], configurable_features, depth + 1))
        }
        return ret;
    }
}

export function getRules(rules: RuleBranch): RuleLeaf[] {
    let ret: RuleLeaf[] = []
    for (let value of rules.values()) {
        if (value instanceof RuleLeaf) {
            ret.push(value)
        } else {
            ret.push(...getRules(value))
        }
    }
    return ret
}

export function getRule(rules: RuleBranch, context: Map<string, string>, features: string[]): RuleLeaf | null {
    let current: any = rules;
    for (let feature of features) {
        let child = current.get(context.get(feature) ?? "*")
        if (child === undefined) {
            return null;
        }
        current = child;
    }
    return current
}

export function AddRule(rules: RuleBranch, newRule: RuleLeaf, features: string[]) {
    let current: any = rules;
    for (let feature_idx in features) {
        let feature = features[feature_idx];
        let key = newRule.context_features.get(feature) ?? "*";
        if (parseInt(feature_idx) === features.length - 1){
            current.set(key, newRule);
            return
        } else{
            let child = current.get(key)
            if (child === undefined) {
                child = new Map();
                current.set(key, child);
            }
            current = child;
        }
    }
}

export function ReplaceRule(rules: RuleBranch, newRule: RuleLeaf, features: string[]) {
    let current: any = rules;
    for (let feature_idx in features) {
        let feature = features[feature_idx];
        let key = newRule.context_features.get(feature) ?? "*";
        if (parseInt(feature_idx) === features.length - 1){
            current.set(key, newRule);
            return
        } else{
            current = current.get(key)!;
        }
    }
}

export function removeRule(rules: RuleBranch, rule_to_remove: RuleLeaf, features: string[]) {
    let current: any = rules;
    for (let feature_idx in features) {
        let feature = features[feature_idx];
        let key = rule_to_remove.context_features.get(feature) ?? "*";
        if (parseInt(feature_idx) === features.length - 1){
            current.delete(key);
            return
        } else{
            current = current.get(key)!;
        }
    }
}

export function ruleBranchCopy(rules: RuleBranch): RuleBranch{
    // @ts-ignore
    return new Map(rules);
}

function _potential_rules(branch: RuleBranch, context_features: string[], context_filters: Map<string, string>, context_matches: ContextMatch[]): RuleMatch[] {
    let cf = context_features[context_matches.length];
    let filter: string | null = context_filters.get(cf) ?? null;
    if (filter === ""){
        filter = null;
    }
    let ret: RuleMatch[] = [];
    if (context_matches.length == context_features.length - 1) {
        // we are at the bottom of the tree, add direct rules
        if (filter !== null) {
            let direct_match = branch.get(filter) as RuleLeaf | undefined;
            if (direct_match !== undefined) {
                ret.push({'rule': direct_match, 'context_matches': [...context_matches, exact_match]})
            }
            let wild_match = branch.get("*") as RuleLeaf | undefined;
            if (wild_match !== undefined) {
                ret.push({'rule': wild_match, 'context_matches': [...context_matches, wildcard]})
            }
        } else {
            for (let [key, rule] of branch.entries()) {
                ret.push({
                    'rule': rule as RuleLeaf,
                    'context_matches': [...context_matches, key == "*" ? presume_wildcard : key]
                })
            }
        }
    } else {
        // recurse
        if (filter !== null) {
            let direct_match = branch.get(filter) as RuleBranch | undefined;
            if (direct_match !== undefined) {
                ret = ret.concat(_potential_rules(direct_match, context_features, context_filters, [...context_matches, exact_match]))
            }
            let wild_match = branch.get("*") as RuleBranch | undefined;
            if (wild_match !== undefined) {
                ret = ret.concat(_potential_rules(wild_match, context_features, context_filters, [...context_matches, wildcard]))
            }
        } else {
            for (let [key, child] of branch.entries()) {
                ret = ret.concat(_potential_rules(child as RuleBranch, context_features, context_filters, [...context_matches, key == "*" ? presume_wildcard : key]))
            }
        }
    }
    return ret
}

export function getPotentialRules(branch: RuleBranch, configurable_features: string[], context_filters: Map<string, string>): PotentialRule[] {
    let results = _potential_rules(branch, configurable_features, context_filters, []);
    let blacklisted_indices = new Set<number>();
    let ret: PotentialRule[] = [];
    for (let i = 0; i < results.length; i++) {
        if (blacklisted_indices.has(i)) {
            continue;
        }
        let candidate = results[i];
        for (let j = i + 1; j < results.length; j++) {
            let challenger = results[j];
            let cmp = compare_matches(candidate.context_matches, challenger.context_matches);
            if (cmp == -1) {
                // the candidate supersedes the challenger, so the challenger is blacklisted
                blacklisted_indices.add(j);
            }
            if (cmp == 1) {
                // the challenger supersedes the candidate, so the candidate is blacklisted
                blacklisted_indices.add(i);
                break // we can break here, since whatever challenger the candidate would blacklist
                // will be blacklisted by j.
            }
        }
        if (!blacklisted_indices.has(i)) {
            ret.push(new PotentialRule(candidate, configurable_features))
        }
    }
    // finally, we sort the rules by their last exact-match condition
    ret.sort((a, b) => -compare_rules(a.rule, b.rule, configurable_features));
    return ret;
}

function compare_matches(a: ContextMatch[], b: ContextMatch[]): number {
    let guard = 0; // -1: a is protected, 1: b is protected
    let advantage = 0; // -1: a is better, 1: b is better
    for (let i = 0; i < a.length; i++) {
        // filter is set
        if (a[i] === exact_match
            && b[i] === exact_match) {
        } else if (a[i] === wildcard
            && b[i] === wildcard) {
        } else if (a[i] === exact_match
            && b[i] === wildcard) {
            advantage = -1;
        } else if (a[i] === wildcard
            && b[i] === exact_match) {
            advantage = 1;
        } // filter is unset
        else if (a[i] === presume_wildcard
            && b[i] === presume_wildcard) {
        } else if (a[i] === presume_wildcard
            && typeof b[i] === 'string') {
            if (guard === 1) {
                return 0;
            }
            guard = -1
            advantage = 0;
        } else if (typeof a[i] === 'string'
            && b[i] === presume_wildcard) {
            if (guard === -1) {
                return 0;
            }
            guard = 1
            advantage = 0;
        } else if (typeof a[i] === 'string'
            && typeof b[i] === 'string'
            && a[i] === b[i]) {
        } else if (typeof a[i] === 'string'
            && typeof b[i] === 'string'
            && a[i] !== b[i]) {
            return 0;
        } else {
            throw new Error("unexpected match type")
        }
    }
    if (advantage !== 0 && guard !== -advantage)
        return advantage;
    return 0;
}

function compare_rules(a: RuleLeaf, b: RuleLeaf, configurable_features: string[]): number {
    let tiebreaker = 0
    for (let i = configurable_features.length - 1; i >= 0; i--) {
        let cf = configurable_features[i];
        let a_val = a.context_features.get(cf) ?? "*";
        let b_val = b.context_features.get(cf) ?? "*";
        if (a_val === '*') {
            if (b_val === '*') {
                continue
            } else {
                return -1
            }
        } else if (b_val === '*') {
            return 1
        }
        tiebreaker = a_val.localeCompare(b_val);
    }
    return tiebreaker
}