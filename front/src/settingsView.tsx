import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Setting } from './setting';
import axios from 'axios';
import { BannerPropsModel, ModelGetSettings, ModelQuery, RuleSet } from './models';
import { Chip, ChipProps, CircularProgress, Fab, Grid, IconButton } from '@mui/material';
import { getPotentialRules, RuleBranch } from './potentialRules';
import MUIDataTable, { MUIDataTableColumn } from 'mui-datatables';
import BallotIcon from '@mui/icons-material/Ballot';
import { TruncChip } from './truncString';
import { ExpandChip } from './expandChip';
import { ContextSelect } from './contextSelect';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { ResizableDrawer } from './resizableDrawer';
import * as React from 'react';
import { RulesView } from './rulesView';
import { ValueViewDialog } from './valueDialog';
import { RuleOptionsView } from './ruleOptionsView';
import { BannerProps } from './app';

const SET_RULES_PANEL_BUTTON_RIGHT_CHANGE_THRESHOLD = 50; // in milliseconds

type SettingsViewProps = {
    setProcessing: (promise: Promise<any> | null) => void;
    setBannerProps: (props: BannerProps) => void;
};

export function SettingsView(props: SettingsViewProps) {
    const [queryResult, setQueryResult] = useState<ModelQuery | null>(null);

    const [contextFeatures, setContextFeatures] = useState<string[] | null>(null);
    const [settings, setSettings] = useState<Setting[] | null>(null);
    const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);

    const [contextFilters, setContextFilters] = useState<Map<string, string>>(new Map());

    const [rulesPanelOpen, setRulesPanelOpen] = useState<boolean>(false);
    const [rulesPanelButtonRight, setRulesPanelButtonRight] = useState<number>(0);

    const [rulesPanelSetting, setRulesPanelSetting] = useState<Setting | null>(null);
    const [rulesPanelContextFilter, setRulesPanelContextFilter] = useState<Map<string, string> | null>(null);
    const rulesPanelRules = useMemo(() => {
        let newRulePanelRules = null;
        if (rulesPanelSetting !== null && ruleSet !== null) {
            newRulePanelRules = ruleSet?.rules_per_setting.get(rulesPanelSetting?.name) ?? null;
        }
        return newRulePanelRules;
    }, [ruleSet, rulesPanelSetting]);

    const [valueViewProps, setValueViewProps] = useState<{
        title: string;
        element: JSX.Element;
        export: string;
    } | null>(null);

    let base_url;
    let base_headers = {};
    if (process.env.REACT_APP_BACKEND_URL !== undefined) {
        base_url = process.env.REACT_APP_BACKEND_URL;
    } else if (process.env.NODE_ENV === 'development') {
        base_url = 'http://localhost:8000';
        base_headers = { 'X-Forwarded-Email': 'john.johnson@place.job' };
    } else {
        throw 'Missing REACT_APP_BACKEND_URL';
    }

    const heksherClient = axios.create({
        baseURL: base_url,
        timeout: 1000,
        headers: base_headers,
    });
    const promises = new Set<Promise<unknown>>();
    const abortController = new AbortController();
    const viewColumnPreference = useRef(new Map<string, boolean>());
    const lastSetRulesPanelButtonRightTime = useRef(0);

    const handleBranchChange = (b: RuleBranch) => {
        const newRuleSet = ruleSet!.copy();
        newRuleSet.rules_per_setting.set(rulesPanelSetting!.name, b);
        setRuleSet(newRuleSet);
    };

    useEffect(() => {
        const cf_promise = heksherClient
            .get('/api/v1/context_features', { signal: abortController.signal })
            .then((response) => {
                promises.delete(cf_promise);
                setContextFeatures(response.data.context_features);
            });
        promises.add(cf_promise);
        const settings_promise = heksherClient
            .get<ModelGetSettings>('/api/v1/settings', { signal: abortController.signal })
            .then((response) => {
                promises.delete(settings_promise);
                setSettings(response.data.settings.map((model) => new Setting(model)));
            });
        promises.add(settings_promise);
        const query_promise = heksherClient
            .get<ModelQuery>('/api/v1/query', { signal: abortController.signal })
            .then((resp) => {
                promises.delete(query_promise);
                setQueryResult(resp.data);
            });
        const banner_promise = heksherClient
            .get<BannerPropsModel | null>('/backend/v1/banner', { signal: abortController.signal })
            .then((resp) => {
                promises.delete(banner_promise);
                if (resp.data != null) {
                    props.setBannerProps({
                        text: resp.data.text,
                        color: resp.data.color,
                        textColor: resp.data.text_color,
                    });
                }
            });
        return () => {
            abortController.abort();
            promises.forEach((p) => p.catch(() => {}));
        };
    }, []); // runs only one
    useEffect(() => {
        if (queryResult === null || settings === null || contextFeatures === null) {
            return;
        }
        const ruleset = RuleSet.fromQuery(queryResult!, contextFeatures!, settings!);
        setRuleSet(ruleset);
    }, [queryResult, settings, contextFeatures]);

    const updateContextFilter = (cf: string, value: string | null) => {
        const new_filters = new Map(contextFilters);
        if (value === null) {
            new_filters.delete(cf);
        } else {
            new_filters.set(cf, value);
        }
        setContextFilters(new_filters);
    };

    if (contextFeatures === null || settings === null || ruleSet === null) {
        return (
            <Grid
                container
                spacing={0}
                direction='column'
                alignItems='center'
                justifyContent='center'
                style={{ minHeight: '100vh' }}
            >
                <CircularProgress />
            </Grid>
        );
    }
    const applicable_rules = settings.map((s) =>
        getPotentialRules(ruleSet!.rules_per_setting.get(s.name)!, s.configurableFeatures, contextFilters, () => true),
    );
    const data = settings.map((setting, i) => setting.to_row(contextFeatures!, applicable_rules[i]));
    const columns: MUIDataTableColumn[] = [
        {
            name: 'name',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const setting = settings![dataIndex];
                    const value = setting.name;
                    return (
                        <>
                            <IconButton
                                onClick={() => {
                                    setRulesPanelOpen(true);
                                    setRulesPanelSetting(setting);
                                }}
                            >
                                <BallotIcon />
                            </IconButton>
                            <span
                                onClick={() => {
                                    setRulesPanelOpen(true);
                                    setRulesPanelSetting(setting);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {value}
                            </span>
                        </>
                    );
                },
            },
        },
        {
            name: 'type',
            options: {
                customBodyRender: (value) => <TruncChip value={value} />,
            },
        },
        {
            name: 'default_value',
            label: 'Default Value',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    const setting = settings![dataIndex];
                    const value = setting.type.Format(setting.default_value);

                    return (
                        <TruncChip
                            value={value}
                            chipProps={{
                                onClick: () =>
                                    setValueViewProps({
                                        title: `${setting.name} default value`,
                                        element: setting.type.asViewElement(setting.default_value),
                                        export: JSON.stringify(setting.default_value),
                                    }),
                            }}
                        />
                    );
                },
            },
        },
        {
            name: 'value_for_context',
            label: 'Value for Context',
            options: {
                customBodyRenderLite: (dataIndex) => {
                    // note that there's always at least one applicable rule, since we include the default
                    const setting = settings![dataIndex];
                    const rules = applicable_rules[dataIndex];
                    let chip: JSX.Element;
                    if (rules.length > 1) {
                        const tooltip =
                            `${rules.length} possible values:\n` +
                            rules.map((r) => r.get_assumptions_string() + ' => ' + r.rule.value).join('\n');
                        chip = (
                            <ExpandChip
                                value={'<' + rules.length + ' Options>'}
                                tooltip={tooltip}
                                chip_props={{
                                    color: 'primary',
                                    onClick: () =>
                                        setValueViewProps({
                                            title: `${rules.length} Options for ${setting.name}:`,
                                            element: <RuleOptionsView options={rules} type={setting.type} />,
                                            export: JSON.stringify(
                                                rules.map((r) => {
                                                    return {
                                                        id: r.rule.rule_id,
                                                        value: r.rule.value,
                                                        context_features: Object.fromEntries(r.rule.context_features),
                                                        metadata: Object.fromEntries(r.rule.metadata),
                                                    };
                                                }),
                                            ),
                                        }),
                                }}
                            />
                        );
                    } else {
                        let value: any;
                        let viewTitle: string;
                        let chipProps: ChipProps = { color: 'primary' };
                        if (rules[0].rule.rule_id === -1) {
                            // default rule
                            value = setting.default_value;
                            chipProps = { color: 'default' };
                            viewTitle = `${setting.name} default value`;
                        } else {
                            value = rules[0].rule.value;
                            viewTitle = `${setting.name} value for rule ${rules[0].rule.rule_id}`;
                        }
                        chip = (
                            <TruncChip
                                value={setting.type.Format(value)}
                                chipProps={{
                                    onClick: () =>
                                        setValueViewProps({
                                            title: viewTitle,
                                            element: setting.type.asViewElement(value),
                                            export: JSON.stringify(value),
                                        }),
                                    ...chipProps,
                                }}
                            />
                        );
                    }

                    return (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{ flexGrow: '1' }}>{chip}</div>
                            <IconButton
                                onClick={() => {
                                    setRulesPanelOpen(true);
                                    setRulesPanelSetting(setting);
                                    setRulesPanelContextFilter(contextFilters);
                                }}
                            >
                                <BallotIcon />
                            </IconButton>
                        </div>
                    );
                },
                display: viewColumnPreference.current.get('value_for_context') ?? contextFilters.size > 0,
            },
        },
        ...contextFeatures.map((cf) => ({
            name: 'cf.' + cf,
            options: {
                display: viewColumnPreference.current.get('cf.' + cf) ?? false,
                customBodyRender: (value: any) => {
                    return value ? <Chip label='True' color='success' /> : <Chip label='False' color='warning' />;
                },
            },
        })),
    ];
    const seen_mds = new Set<string>();
    for (const setting of settings) {
        for (const key of setting.metadata.keys()) {
            if (seen_mds.has(key)) {
                continue;
            }
            seen_mds.add(key);
            columns.push({
                name: 'md.' + key,
                options: {
                    display: viewColumnPreference.current.get('md.' + key) ?? false,
                },
            });
        }
    }
    return (
        <Fragment>
            <ContextSelect
                context_options={ruleSet.context_options}
                filterChangeCallback={updateContextFilter}
                stackProps={{ direction: 'row', justifyContent: 'flex-start', spacing: 2 }}
            />
            <MUIDataTable
                title='Settings'
                data={data}
                columns={columns}
                options={{
                    responsive: 'standard',
                    print: false,
                    draggableColumns: { enabled: true },
                    resizableColumns: true,
                    // @ts-ignore
                    searchAlwaysOpen: true,
                    onViewColumnsChange: (c: string, a: string) => {
                        if (a == 'add') {
                            viewColumnPreference.current.set(c, true);
                        } else if (a == 'remove') {
                            viewColumnPreference.current.set(c, false);
                        }
                    },
                    selectableRows: 'none',
                }}
            />
            <Fab
                onClick={() => setRulesPanelOpen(!rulesPanelOpen)}
                style={{
                    position: 'absolute',
                    top: 30,
                    right: rulesPanelOpen ? rulesPanelButtonRight : 0,
                    zIndex: 1250, // default z index is 1200 for drawers and I neither know nor care why
                }}
                variant={rulesPanelSetting === null ? 'circular' : 'extended'}
                disabled={rulesPanelSetting === null}
            >
                {
                    <>
                        {rulesPanelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        {rulesPanelSetting?.name}
                    </>
                }
            </Fab>
            <ResizableDrawer
                drawerProps={{
                    variant: 'persistent',
                    anchor: 'right',
                    open: rulesPanelOpen,
                }}
                minWidth={200}
                maxWidth={1000}
                onWidthChange={(w) => {
                    // we need to move the button to be on the drawer's edge
                    // since this update happens a lot, we only change the location of the button once every X
                    // millis todo is there a better way?
                    if (
                        +new Date() - lastSetRulesPanelButtonRightTime.current >
                        SET_RULES_PANEL_BUTTON_RIGHT_CHANGE_THRESHOLD
                    ) {
                        setRulesPanelButtonRight(w);
                        lastSetRulesPanelButtonRightTime.current = +new Date();
                    }
                }}
            >
                {rulesPanelSetting !== null && rulesPanelRules !== null && (
                    <RulesView
                        setting={rulesPanelSetting}
                        rules={rulesPanelRules}
                        initialContextFilter={rulesPanelContextFilter ?? undefined}
                        parentContextOptions={ruleSet.context_options}
                        processingCallback={(p) => props.setProcessing(p)}
                        onRuleChange={(b: RuleBranch) => handleBranchChange(b)}
                        heksherClient={heksherClient}
                    />
                )}
            </ResizableDrawer>

            <ValueViewDialog
                open={valueViewProps !== null}
                onClose={() => setValueViewProps(null)}
                title={valueViewProps !== null ? valueViewProps.title : ''}
                export={valueViewProps !== null ? valueViewProps.export : ''}
            >
                {valueViewProps !== null && valueViewProps.element}
            </ValueViewDialog>
        </Fragment>
    );
}
