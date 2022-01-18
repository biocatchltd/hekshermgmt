import axios, {AxiosInstance} from 'axios';
import * as React from 'react';
import {Fragment} from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import BallotIcon from '@mui/icons-material/Ballot';
import {createTheme} from "@mui/material/styles";
import {ThemeProvider} from "@mui/styles";
import MUIDataTable, {MUIDataTableColumn} from "mui-datatables";
import {Box, Button, Chip, ChipProps, CircularProgress, Fab, Grid, IconButton} from "@mui/material";
import {ContextSelect} from "./context_select";
import {TruncChip} from "./trunc_string";
import {GetPotentialRules, RuleBranch, ruleBranchFromRules, RuleLeaf} from "./potential_rules";
import {ExpandChip} from "./expand_chip";
import {Setting} from "./setting";
import {ResizableDrawer} from "./resizable_drawer";

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

interface ModelQuery {
    settings: { [key: string]: { rules: ModelRule[], default_value: any } }
}

export interface ModelRule {
    value: any
    context_features: [string, string][]
    rule_id: number
    metadata: Record<string, any>
}

class RuleSet {
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

type MainProps = {}

type MainState = {
    context_features: string[] | null
    settings: Setting[] | null
    rule_set: RuleSet | null
    context_filters: Record<string, string>

    setting_panel_open: boolean
    setting_panel_target: string | null
    setting_panel_button_right: number
}

export class Main extends React.Component<MainProps, MainState> {
    heksher_client: AxiosInstance
    promises: Set<Promise<any>>
    abort_controller: AbortController
    view_column_preference: Map<string, boolean> = new Map()

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
            context_filters: {},
            setting_panel_open: false,
            setting_panel_target: null,
            setting_panel_button_right: 0
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
            this.setState({
                settings: response.data.settings.map(model => {
                    return new Setting(model)
                })
            });
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
        let ruleset_promise = Promise.all([query_promise, cf_promise, settings_promise])
            .then(([query_response]) => {
                this.setState({rule_set: new RuleSet(query_response.data, this.state.context_features!, this.state.settings!)});
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
            return (<Grid container
                          spacing={0}
                          direction="column"
                          alignItems="center"
                          justifyContent="center"
                          style={{minHeight: '100vh'}}>
                <CircularProgress/>
            </Grid>)
        }
        let applicable_rules = this.state.settings.map(s =>
            GetPotentialRules(this.state.rule_set?.rules_per_setting.get(s.name)!, s.configurable_features,
                this.state.context_filters))

        let data = this.state.settings.map((setting, i) => setting.to_row(this.state.context_features!, applicable_rules[i]));
        let columns: (string | MUIDataTableColumn)[] = [
            {
                name: 'name',
                options: {
                    customBodyRenderLite: (dataIndex) => {
                        let setting = this.state.settings![dataIndex];
                        let value = setting.name;
                        return <>
                            <IconButton onClick={() => this.setState({
                                setting_panel_target: setting.name,
                                setting_panel_open: true
                            })}>
                                <BallotIcon/>
                            </IconButton>
                            {value}
                        </>
                    }
                }
            },
            {
                name: 'type',
                options: {
                    customBodyRender: (value) => <TruncChip value={value}/>
                }
            },
            {
                name: 'default_value',
                label: 'Default Value',
                options: {
                    customBodyRenderLite: (dataIndex) => {
                        let setting = this.state.settings![dataIndex];
                        let value = setting.type.Format(setting.default_value);
                        return <TruncChip value={value}/>
                    }
                }
            },
            {
                name: 'value_for_context',
                label: 'Value for Context',
                options: {
                    customBodyRenderLite: (dataIndex) => {
                        // note that there's always at least one applicable rule, since we include the default
                        let setting = this.state.settings![dataIndex];
                        let rules = applicable_rules[dataIndex];
                        if (rules.length > 1) {
                            let tooltip = `${rules.length} possible values:\n`
                                + rules.map(r => r.get_assumptions_string() + ' => ' + r.rule.value).join('\n');
                            return <ExpandChip value={'<' + rules.length + ' Options>'} tooltip={tooltip}
                                               chip_props={{color: 'primary'}}/>
                        } else {
                            let value;
                            let sx: ChipProps = {color: 'primary'};
                            if (rules[0].rule.rule_id === -1) {
                                // default rule
                                value = setting.type.Format(setting.default_value)
                                sx = {color: 'default'};
                            } else {
                                value = setting.type.Format(rules[0].rule.value);
                            }
                            return <TruncChip value={value} chip_props={sx}/>
                        }
                    },
                    display: this.view_column_preference.get('value_for_context')
                        ?? Object.keys(this.state.context_filters).length > 0
                }
            },
            ...this.state.context_features.map(cf => ({
                name: 'cf.' + cf,
                options: {
                    display: this.view_column_preference.get('cf.' + cf) ?? false,
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
                        display: this.view_column_preference.get('md.' + key) ?? false
                    }
                })
            }
        }
        return (
            <Fragment>
                <ThemeProvider theme={createTheme()}>
                    <ContextSelect context_options={this.state.rule_set.context_options} owner={this}/>
                    <MUIDataTable
                        title="Settings"
                        data={data}
                        columns={columns}
                        options={{
                            'responsive': 'standard',
                            'print': false,
                            'draggableColumns': {'enabled': true},
                            'resizableColumns': true,
                            // @ts-ignore
                            'searchAlwaysOpen': true,
                            'onViewColumnsChange': (c: string, a: string) => {
                                if (a == 'add') {
                                    this.view_column_preference.set(c, true);
                                } else if (a == 'remove') {
                                    this.view_column_preference.set(c, false);
                                }
                            },
                            'selectableRows': 'none',
                        }}
                    />
                    <Fab onClick={() => this.setState({
                        'setting_panel_open': !this.state.setting_panel_open,
                    })}
                         style={{
                             position: "absolute",
                             top: 30,
                             right: this.state.setting_panel_open ? (this.state.setting_panel_button_right - 16) : 0,
                             zIndex: 1400, // default z index is 1300 for drawers and I neither know  nor care why
                         }}
                         variant={this.state.setting_panel_open ? "circular" : "extended"}
                         disabled={this.state.setting_panel_target == null}>
                        {this.state.setting_panel_open ? <ChevronRightIcon/> : (
                            <><ChevronLeftIcon/>{this.state.setting_panel_target ?? 'Setting'}</>
                        )}
                    </Fab>
                    <ResizableDrawer
                        drawerProps={{
                            variant: "persistent",
                            anchor: "right",
                            open: this.state.setting_panel_open,
                        }}
                        minWidth={200}
                        maxWidth={1000}
                        onWidthChange={(w) => this.setState({'setting_panel_button_right': w})}
                    >
                        laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                    </ResizableDrawer>
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
