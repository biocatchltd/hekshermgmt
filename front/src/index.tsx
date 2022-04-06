import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import { RuleBranch, ruleBranchFromRules, RuleLeaf } from './potential_rules';
import { Setting } from './setting';
import { App } from './app';

export interface ModelGetSettings {
    settings: ModelGetSetting[];
}

export interface ModelGetSetting {
    name: string;
    type: string;
    default_value: string;
    configurable_features: string[];
    metadata: Record<string, any>;
}

export interface ModelQuery {
    settings: { [key: string]: { rules: ModelRule[]; default_value: any } };
}

export interface ModelRule {
    value: any;
    context_features: [string, string][];
    rule_id: number;
    metadata: Record<string, any>;
}

export interface ModelGetRule {
    setting: string;
    value: any;
    feature_values: [string, string][];
    metadata: Record<string, any>;
}

export class RuleSet {
    rules_per_setting: Map<string, RuleBranch>;
    context_options: Map<string, Set<string>>;

    constructor(rules_per_setting: Map<string, RuleBranch>, context_options: Map<string, Set<string>>) {
        this.rules_per_setting = rules_per_setting;
        this.context_options = context_options;
    }

    static fromQuery(model: ModelQuery, context_features: string[], settings: Setting[]): RuleSet {
        const settings_by_name: Map<string, Setting> = new Map(settings.map((s) => [s.name, s]));
        const rules_per_setting = new Map<string, RuleBranch>();
        const context_options = new Map(context_features.map((cf) => [cf, new Set<string>()]));
        for (const setting_name in model.settings) {
            const setting = settings_by_name.get(setting_name)!;
            const setting_data = model.settings[setting_name];
            const uncollated_rules: RuleLeaf[] = setting_data.rules.map((r) => RuleLeaf.fromModel(r));
            uncollated_rules.push(RuleLeaf.defaultRule(setting_data.default_value));

            rules_per_setting.set(setting_name, ruleBranchFromRules(uncollated_rules, setting.configurableFeatures));
            for (const rule of uncollated_rules) {
                for (const cf of context_features) {
                    const val = rule.context_features.get(cf);
                    if (val !== undefined) {
                        context_options.get(cf)!.add(val);
                    }
                }
            }
        }
        return new RuleSet(rules_per_setting, context_options);
    }

    copy(): RuleSet {
        return new RuleSet(new Map(this.rules_per_setting), new Map(this.context_options));
    }
}

// ========================================

ReactDOM.render(<App />, document.getElementById('root'));
