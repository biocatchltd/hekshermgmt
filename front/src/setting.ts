import { settingType, SettingType } from './settingType';
import { PotentialRule } from './potentialRules';
import { ModelGetSetting } from './models';

export class Setting {
    name: string;
    type: SettingType<any>;
    default_value: any;
    configurableFeatures: string[];
    metadata: Map<string, any>;

    constructor(model: ModelGetSetting) {
        this.name = model.name;
        this.type = settingType(model.type);
        this.default_value = model.default_value;
        this.configurableFeatures = model.configurable_features;
        this.metadata = new Map<string, any>(Object.entries(model.metadata));
    }

    to_row(context_feature_names: string[], applicable_rules: PotentialRule[]): Record<string, any> {
        const ret: { [key: string]: any } = {
            name: this.name,
            type: this.type.toString(),
            default_value: this.type.asData(this.default_value),
            configurable_features: this.configurableFeatures.join(', '),
        };
        // note that there's always at least one applicable rule, since we include the default
        if (applicable_rules.length > 1) {
            ret['value_for_context'] = '<multiple>';
        } else if (applicable_rules[0].rule.rule_id === -1) {
            // default rule
            ret['value_for_context'] = ret['default_value'];
        } else {
            ret['value_for_context'] = this.type.asData(applicable_rules[0].rule.value);
        }

        for (const [key, value] of this.metadata) {
            ret['md.' + key] = JSON.stringify(value);
        }
        for (const cf of context_feature_names) {
            ret['cf.' + cf] = this.configurableFeatures.includes(cf);
        }
        return ret;
    }
}
