import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import {GetPotentialRules, RuleBranch, ruleBranchFromRules, RuleLeaf} from "./potential_rules";
import {Setting} from "./setting";
import {SettingsView} from "./settings_view";

export interface ModelGetSettings {
    settings: ModelGetSetting[];
}

export interface ModelGetSetting {
    name: string
    type: string
    default_value: string
    configurable_features: string[]
    metadata: Record<string, any>
}

export interface ModelQuery {
    settings: { [key: string]: { rules: ModelRule[], default_value: any } }
}

export interface ModelRule {
    value: any
    context_features: [string, string][]
    rule_id: number
    metadata: Record<string, any>
}

export class RuleSet {
    rules_per_setting: Map<string, RuleBranch>
    context_options: Map<string, Set<string>>

    constructor(model: ModelQuery, context_features: string[], settings: Setting[]) {
        let settings_by_name: Map<string, Setting> = new Map(settings.map(s => [s.name, s]));
        this.rules_per_setting = new Map<string, RuleBranch>()
        this.context_options = new Map(context_features.map(cf => [cf, new Set<string>()]))
        for (let setting_name in model.settings) {
            let setting = settings_by_name.get(setting_name)!;
            let setting_data = model.settings[setting_name];
            let uncollated_rules: RuleLeaf[] = setting_data.rules.map(r => new RuleLeaf(r));
            uncollated_rules.push(new RuleLeaf({
                value: setting_data.default_value,
                context_features: [],
                rule_id: -1,
                metadata: new Map()
            }))

            this.rules_per_setting.set(setting_name,
                ruleBranchFromRules(uncollated_rules, setting.configurable_features));
            for (let rule of uncollated_rules) {
                for (let cf of context_features) {
                    let val = rule.context_features.get(cf);
                    if (val !== undefined) {
                        this.context_options.get(cf)!.add(val)
                    }
                }
            }
        }
    }
}

// ========================================

ReactDOM
    .render(
        <SettingsView/>,
        document
            .getElementById(
                'root'
            )
    );
