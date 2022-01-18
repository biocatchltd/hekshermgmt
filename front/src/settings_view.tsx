import {Fragment, useEffect, useRef, useState} from "react";
import {Setting} from "./setting";
import axios from 'axios';
import {ModelGetSettings, ModelQuery, RuleSet} from "./index";
import {Chip, ChipProps, CircularProgress, Fab, Grid, IconButton} from "@mui/material";
import {GetPotentialRules} from "./potential_rules";
import MUIDataTable, {MUIDataTableColumn} from "mui-datatables";
import BallotIcon from "@mui/icons-material/Ballot";
import {TruncChip} from "./trunc_string";
import {ExpandChip} from "./expand_chip";
import {ThemeProvider} from "@mui/styles";
import {createTheme} from "@mui/material/styles";
import {ContextSelect} from "./context_select";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import {ResizableDrawer} from "./resizable_drawer";
import * as React from "react";
import {RulesView} from "./rules_view";

const SET_RULES_PANEL_BUTTON_RIGHT_CHANGE_THRESHOLD = 50; // in milliseconds

export function SettingsView() {
    const [queryResult, setQueryResult] = useState<ModelQuery | null>(null);

    const [contextFeatures, setContextFeatures] = useState<string[] | null>(null);
    const [settings, setSettings] = useState<Setting[] | null>(null);
    const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);

    const [contextFilters, setContextFilters] = useState<Map<string, string>>(new Map());

    const [rulesPanelOpen, setRulesPanelOpen] = useState<boolean>(false);
    const [rulesPanelButtonRight, setRulesPanelButtonRight] = useState<number>(0);

    const [rulesPanelSetting, setRulesPanelSetting] = useState<Setting | null>(null);

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

    const heksherClient = axios.create({
        baseURL: base_url,
        timeout: 1000,
        headers: base_headers
    })
    const promises = new Set<Promise<unknown>>()
    const abortController = new AbortController();
    const viewColumnPreference = useRef(new Map<string, boolean>())
    const lastSetRulesPanelButtonRightTime = useRef(0);

    useEffect(() => {
        let cf_promise = heksherClient.get('/api/v1/context_features',
            {signal: abortController.signal}).then(response => {
            promises.delete(cf_promise)
            setContextFeatures(response.data.context_features);
        })
        promises.add(
            cf_promise
        )
        let settings_promise = heksherClient.get<ModelGetSettings>('/api/v1/settings',
            {signal: abortController.signal}).then(response => {
            promises.delete(settings_promise)
            setSettings(response.data.settings.map(model => new Setting(model)));
        })
        promises.add(
            settings_promise
        )
        let query_promise = heksherClient.get<ModelQuery>('/api/v1/query',
            {signal: abortController.signal}).then((resp) => {
            promises.delete(query_promise)
            setQueryResult(resp.data);
        })
        return () => {
            abortController.abort()
            promises.forEach(p => p.catch(() => {
            }))
        }
    }, []) // runs only one
    useEffect(() => {
        if (queryResult === null || settings === null || contextFeatures === null) {
            return;
        }
        const ruleset = new RuleSet(queryResult!, contextFeatures!, settings!);
        setRuleSet(ruleset);
    }, [queryResult, settings, contextFeatures])

    const updateContextFilter = (cf: string, value: string|null) => {
        let new_filters = new Map(contextFilters);
        if (value === null) {
            new_filters.delete(cf);
        } else {
            new_filters.set(cf, value);
        }
        setContextFilters(new_filters);
    }

    if (contextFeatures === null || settings === null || ruleSet === null) {
        return (<Grid container
                      spacing={0}
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                      style={{minHeight: '100vh'}}>
            <CircularProgress/>
        </Grid>)
    }
    let applicable_rules = settings.map(s =>
        GetPotentialRules(ruleSet?.rules_per_setting.get(s.name)!, s.configurable_features, contextFilters))

    let data = settings.map((setting, i) => setting.to_row(contextFeatures!, applicable_rules[i]));
    let columns: (string | MUIDataTableColumn)[] = [
        {
            name: 'name',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    let setting = settings![dataIndex];
                    let value = setting.name;
                    return <>
                        <IconButton onClick={() => {
                            setRulesPanelOpen(true);
                            setRulesPanelSetting(setting);
                        }}>
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
                    let setting = settings![dataIndex];
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
                    let setting = settings![dataIndex];
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
                display: viewColumnPreference.current.get('value_for_context')
                    ?? contextFilters.size > 0
            }
        },
        ...contextFeatures.map(cf => ({
            name: 'cf.' + cf,
            options: {
                display: viewColumnPreference.current.get('cf.' + cf) ?? false,
                customBodyRender: (value: any) => {
                    return value ?
                        <Chip label="True" color="success"/> :
                        <Chip label="False" color="warning"/>;
                }
            }
        }))
    ]
    let seen_mds = new Set<string>();
    for (let setting of settings) {
        for (let key in setting.metadata) {
            if (seen_mds.has(key)) {
                continue
            }
            seen_mds.add(key)
            columns.push({
                name: 'md.' + key,
                options: {
                    display: viewColumnPreference.current.get('md.' + key) ?? false
                }
            })
        }
    }
    return (
        <Fragment>
            <ThemeProvider theme={createTheme()}>
                <ContextSelect context_options={ruleSet.context_options}
                               filterChangeCallback={updateContextFilter}/>
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
                                viewColumnPreference.current.set(c, true);
                            } else if (a == 'remove') {
                                viewColumnPreference.current.set(c, false);
                            }
                        },
                        'selectableRows': 'none',
                    }}
                />
                <Fab onClick={() => setRulesPanelOpen(!rulesPanelOpen)}
                     style={{
                         position: "absolute",
                         top: 30,
                         right: rulesPanelOpen ? rulesPanelButtonRight : 0,
                         zIndex: 1400, // default z index is 1300 for drawers and I neither know nor care why
                     }}
                     variant={(rulesPanelSetting === null) ? "circular" : "extended"}
                     disabled={rulesPanelSetting === null}>
                    {<>{(rulesPanelOpen ? <ChevronRightIcon/> : <ChevronLeftIcon/>)}{rulesPanelSetting?.name}</>}
                </Fab>
                <ResizableDrawer
                    drawerProps={{
                        variant: "persistent",
                        anchor: "right",
                        open: rulesPanelOpen,
                    }}
                    minWidth={200}
                    maxWidth={1000}
                    onWidthChange={(w) => {
                        // since this update happens a lot, we only change the location of the button once every X
                        // millis todo is there a better way?
                        if ((+ new Date()) - lastSetRulesPanelButtonRightTime.current
                            > SET_RULES_PANEL_BUTTON_RIGHT_CHANGE_THRESHOLD) {
                            setRulesPanelButtonRight(w);
                            lastSetRulesPanelButtonRightTime.current = + new Date();
                        }
                    }}
                >
                    {rulesPanelSetting !== null &&
                        <RulesView setting={rulesPanelSetting}
                                   rules={ruleSet.rules_per_setting.get(rulesPanelSetting.name)!}/>
                    }
                </ResizableDrawer>
            </ThemeProvider>
        </Fragment>
    )
}