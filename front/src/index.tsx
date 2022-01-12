import axios, {AxiosInstance} from 'axios';
import * as React from 'react';
import {Fragment} from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import {createTheme} from "@mui/material/styles";
import {ThemeProvider} from "@mui/styles";
import MUIDataTable, {MUIDataTableColumn} from "mui-datatables";
import {SettingType, settingType} from "./setting_type";
import {Chip, CircularProgress} from "@mui/material";
import {ContextSelect} from "./context_select";
import {TruncString} from "./trunc_string";

interface ModelGetSettings {
    settings: ModelGetSetting[];
}

interface ModelGetSetting {
    name: string
    type: string
    default_value: string
    configurable_features: string[]
    metadata: Record<string, any>
}

class Setting {
    name: string
    type: SettingType
    default_value: string
    configurable_features: string[]
    metadata: Record<string, any>

    constructor(model: ModelGetSetting) {
        this.name = model.name;
        this.type = settingType(model.type);
        this.default_value = model.default_value;
        this.configurable_features = model.configurable_features;
        this.metadata = model.metadata;
    }

    to_row(context_feature_names: string[], applicable_rules: RuleLeaf[]): Record<string, any> {
        let ret: { [key: string]: any } = {
            name: this.name,
            type: this.type.toString(),
            default_value: this.type.asData(this.default_value),
            configurable_features: this.configurable_features.join(', '),
        }
        if (applicable_rules.length == 1){
            ret['value_for_context'] = this.type.asData(applicable_rules[0].value);
        }
        else if (applicable_rules.length > 1){
            ret['value_for_context'] = "<multiple>"
        }
        else {
            ret['value_for_context'] = ret['default_value']
        }
        for (let key in this.metadata) {
            ret["md." + key] = JSON.stringify(this.metadata[key]);
        }
        for (let cf of context_feature_names) {
            ret["cf." + cf] = this.configurable_features.includes(cf)
        }
        return ret
    }
}

interface ModelQuery {
    settings: { [key: string]: {rules: ModelRule[]} }
}
interface ModelRule {
    value: any
    context_features: [string, string][]
    rule_id: number
    metadata: Record<string, any>
}

class UncollatedRule{
    value: any
    context_features: Record<string, string>
    rule_id: number
    metadata: Record<string, any>

    constructor(model: ModelRule) {
        this.value = model.value;
        this.context_features = {}
        for (let [cf, value] of model.context_features) {
            this.context_features[cf] = value
        }
        this.rule_id = model.rule_id;
        this.metadata = model.metadata;
    }
}

class RuleLeaf {
    value: any
    rule_id: number
    last_exact_match_depth: number
    metadata: Record<string, any>

    constructor(model: UncollatedRule, context_features: string[]) {
        this.value = model.value;
        this.rule_id = model.rule_id;
        this.metadata = model.metadata;
        this.last_exact_match_depth = -1;
        for (let i = context_features.length - 1; i >= 0; i--) {
            let cf = context_features[i];
            if (cf in model.context_features) {
                this.last_exact_match_depth = i;
                break;
            }
        }
    }
}

type RuleBranch = Record<string, RuleLeaf> | RuleNode  // the key "*" specified wildcard
interface RuleNode extends Record<string, RuleBranch>{}

function ruleBranchFromRules(rules: UncollatedRule[], context_features: string[], depth: number=0): RuleBranch{
    let cf = context_features[depth];
    let ret: RuleBranch = {}
    if (depth == context_features.length - 1) {
        // we are at the bottom of the tree, add direct rules
        let ret: RuleBranch = {};
        for (let rule of rules) {
            ret[rule.context_features[cf] ?? "*"] = new RuleLeaf(rule, context_features);
        }
        return ret;
    } else {
        // recurse
        let children: Record<string, UncollatedRule[]> = {}
        for (let rule of rules) {
            let value = rule.context_features[cf] ?? "*";
            if (!(value in children)) {
                children[value] = []
            }
            children[value].push(rule)
        }
        for (let value in children) {
            ret[value] = ruleBranchFromRules(children[value], context_features, depth + 1)
        }
        return ret;
    }
}
function potential_rules(branch: RuleBranch, context_features: string[], context_filters: Record<string, string>, depth=0): RuleLeaf[] {
    let cf = context_features[depth];
    let filter: string | null = context_filters[cf] ?? null;
    let ret: RuleLeaf[] = [];
    if (depth == context_features.length - 1) {
        // we are at the bottom of the tree, add direct rules
        if (filter !== null){
            let direct_match = branch[filter] as RuleLeaf | undefined;
            if (direct_match !== undefined) {
                ret.push(direct_match)
            }
        }
        let wild_match = branch["*"] as RuleLeaf | undefined;
        if (wild_match !== undefined) {
            ret.push(wild_match)
        }

    } else {
        // recurse
        if (filter !== null){
            let direct_match = branch[filter] as RuleBranch | undefined;
            if (direct_match !== undefined) {
                ret = ret.concat(potential_rules(direct_match, context_features, context_filters, depth + 1))
            }
        }
        let wild_match = branch["*"] as RuleBranch | undefined;
        if (wild_match !== undefined) {
            ret = ret.concat(potential_rules(wild_match, context_features, context_filters, depth + 1))
        }
    }
    return ret
}

class RuleSet {
    rules_per_setting: Record<string, RuleBranch>
    context_options: Record<string, Set<string>>

    constructor(model: ModelQuery, context_features: string[]) {
        this.rules_per_setting = {}
        this.context_options = Object.fromEntries(context_features.map(cf => [cf, new Set<string>()]))
        for (let setting_name in model.settings) {
            let setting_data = model.settings[setting_name];
            let uncollated_rules: UncollatedRule[] = setting_data.rules.map(r => new UncollatedRule(r));
            this.rules_per_setting[setting_name] = ruleBranchFromRules(uncollated_rules, context_features);
            for (let rule of uncollated_rules) {
                for (let cf of context_features) {
                    let val = rule.context_features[cf];
                    if (val !== undefined) {
                        this.context_options[cf].add(val)
                    }
                }
            }
        }
    }
}

type MainProps = {}

type MainState = {
    context_features: string[] | null
    settings: Setting[] | null
    rule_set: RuleSet | null
    context_filters: Record<string, string>
}

export class Main extends React.Component<MainProps, MainState> {
    heksher_client: AxiosInstance
    promises: Set<Promise<any>>
    abort_controller: AbortController

    constructor(props: MainProps) {
        super(props);
        let base_url;
        let base_headers = {};
        if (process.env.REACT_APP_HEKSHER_URL) {
            base_url = process.env.REACT_APP_HEKSHER_URL;
        } else if (process.env.NODE_ENV === 'development') {
            base_url = 'http://localhost:8000';
            base_headers = {'X-Forwarded-Email': 'john.johnson@place.job'};
        } else {
            throw 'Missing REACT_APP_HEKSHER_URL';
        }
        this.heksher_client = axios.create({
            baseURL: base_url,
            timeout: 1000,
            headers: base_headers
        });
        this.promises = new Set();
        this.abort_controller = new AbortController();
        this.state = {
            context_features: null,
            settings: null,
            rule_set: null,
            context_filters: {}
        };
    }

    set_context_filter(cf: string, value: string | null) {
        let new_filters = {...this.state.context_filters};
        if (value === null) {
            delete new_filters[cf];
        } else {
            new_filters[cf] = value;
        }
        this.setState({context_filters: new_filters});
    }

    componentDidMount() {
        let cf_promise = this.heksher_client.get('/api/v1/context_features',
            {signal: this.abort_controller.signal}).then(response => {
            this.setState({context_features: response.data['context_features']});
            this.promises.delete(cf_promise)
        })
        this.promises.add(
            cf_promise
        )
        let settings_promise = this.heksher_client.get<ModelGetSettings>('/api/v1/settings',
            {signal: this.abort_controller.signal}).then(response => {
            this.setState({settings: response.data.settings.map(model => new Setting(model))});
            this.promises.delete(settings_promise)
        })
        this.promises.add(
            settings_promise
        )
        let query_promise = this.heksher_client.get<ModelQuery>('/api/v1/query',
            {signal: this.abort_controller.signal}).then((resp) => {
                this.promises.delete(query_promise)
                return resp
        })
        let ruleset_promise = Promise.all([query_promise, cf_promise]).then(([query_response, _]) => {
            this.setState({rule_set: new RuleSet(query_response.data, this.state.context_features!)})
            this.promises.delete(ruleset_promise)
        })
        this.promises.add(
            ruleset_promise
        )
    }

    componentWillUnmount() {
        this.abort_controller.abort();
        this.promises.forEach(promise => {
            promise.catch(() => {
            })
        })
    }

    render() {
        if (this.state.context_features === null || this.state.settings === null || this.state.rule_set === null) {
            return <CircularProgress />
        }
        console.log('!!! render')
        let applicable_rules = this.state.settings.map(s =>potential_rules(this.state.rule_set?.rules_per_setting[s.name]!, this.state.context_features!, this.state.context_filters))
        let data = this.state.settings.map((setting,i) => setting.to_row(this.state.context_features!, applicable_rules[i]));
        let columns: (string | MUIDataTableColumn)[] = [
            {
                name: 'name',
            },
            {
                name: 'type',
                options: {
                    customBodyRender: (value) => <TruncString value={value}/>
                }
            },
            {
                name: 'default_value',
                label: 'Default Value',
                options: {
                    customBodyRenderLite: (dataIndex) => {
                        let setting = this.state.settings![dataIndex];
                        let value = setting.type.Format(setting.default_value);
                        return <TruncString value={value}/>
                    }
                }
            },
            ...this.state.context_features.map(cf => ({
                name: 'cf.' + cf,
                options: {
                    display: false,
                    customBodyRender: (value: any) => {
                        return value ?
                            <Chip label="True" color="success"/> :
                            <Chip label="False" color="warning"/>;
                    }
                }
            }))
        ]
        let seen_mds = new Set<string>();
        for (let setting of this.state.settings) {
            for (let key in setting.metadata) {
                if (seen_mds.has(key)) {
                    continue
                }
                seen_mds.add(key)
                columns.push({
                    name: 'md.' + key,
                    options: {
                        display: false
                    }
                })
            }
        }
        if (Object.keys(this.state.context_filters).length > 0) {
            columns.push({
                name: 'value_for_context',
                label: 'Value for Context',
                options: {
                    customBodyRenderLite: (dataIndex) => {
                        let value: string = data[dataIndex]['value_for_context'];
                        let sx = {color: 'primary.main'};
                        if (applicable_rules[dataIndex].length === 0) {
                            sx = {color: 'text.primary'};
                        }
                        return <TruncString value={value} sx={sx}/>
                    }
                }
            })
        }
        return (
            <Fragment>
            <ContextSelect context_options={this.state.rule_set.context_options} owner={this}/>
            <ThemeProvider theme={createTheme()}>
                <MUIDataTable
                    title="Settings"
                    data={data}
                    columns={columns}
                    options={{
                        'responsive': 'standard',
                        'print': false,
                        'draggableColumns': {'enabled':true},
                        'resizableColumns': true,
                        // @ts-ignore
                        'searchAlwaysOpen': true,
                }}
                />
            </ThemeProvider>
            </Fragment>
        )
    }
}

// ========================================

ReactDOM
    .render(
        <Main/>,
        document
            .getElementById(
                'root'
            )
    );
