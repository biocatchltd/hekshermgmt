import { Setting } from './setting';
import {
    AddRule,
    getPotentialRules,
    getRules,
    PotentialRule,
    removeRule,
    ReplaceRule,
    RuleBranch,
    ruleBranchCopy,
    RuleLeaf,
} from './potential_rules';
import * as React from 'react';
import {
    Card,
    Stack,
    Typography,
    Collapse,
    Link,
    Fab,
    CardActions,
    CardContent,
    IconButton,
    AccordionSummary,
    Accordion,
    AccordionDetails,
    TextField,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { TruncChip } from './trunc_string';
import { ContextSelect } from './context_select';
import { TransitionGroup } from 'react-transition-group';
import { ValueEditDialogConstContext, ValueEditDialogNewContext, ValueViewDialog } from './value_dialog';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useMemo, useState } from 'react';
import { AxiosInstance } from 'axios';
import { ModelGetRule } from './index';
import { ConfirmDialog } from './confirm_dialog';
import { useSnackbar } from 'notistack';

interface ModelAddRuleResponse {
    rule_id: number;
}

type RuleCardProps = {
    setting: Setting;
    potentialRule: PotentialRule;
    onValueClick: () => void;
    isDefault: boolean;
    onEditClick: () => void;
    onDeleteClick: () => void;
};

/**
 * extract the metadata of a rule, ordered by importance
 */
function getRuleMetadataKeys(rule: RuleLeaf): [string, any][] {
    const important_keys = ['added_by', 'date'];
    const keys = Array.from(rule.metadata.entries());
    keys.sort((a, b) => {
        if (important_keys.includes(a[0])) {
            if (!important_keys.includes(b[0])) {
                return -1;
            }
        } else if (important_keys.includes(b[0])) {
            return 1;
        }

        return a[0].localeCompare(b[0]);
    });
    keys.push(['<id>', rule.rule_id]);
    return keys;
}

function RuleCard(props: RuleCardProps) {
    return (
        <Card sx={{ p: '16px' }}>
            <Link variant='h6' underline='hover' onClick={props.onValueClick}>
                {props.setting.type.Format(props.potentialRule.rule.value)}
            </Link>
            <CardContent>
                {props.isDefault ? (
                    <Typography variant='body1'>Setting Default</Typography>
                ) : (
                    <>
                        <Typography variant='body1'>{props.potentialRule.get_assumptions_string()}</Typography>
                        {getRuleMetadataKeys(props.potentialRule.rule).map(([k, v]) => (
                            <Typography variant='body2' key={k}>
                                {k}: {JSON.stringify(v)}
                            </Typography>
                        ))}
                    </>
                )}
            </CardContent>
            {!props.isDefault && (
                <CardActions style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton size='small' onClick={() => props.onEditClick()}>
                        <EditIcon />
                    </IconButton>
                    <IconButton size='small' onClick={() => props.onDeleteClick()}>
                        <DeleteIcon />
                    </IconButton>
                </CardActions>
            )}
        </Card>
    );
}

type RulesViewProps = {
    setting: Setting;
    rules: RuleBranch;
    initialContextFilter: Map<string, string> | undefined;
    parentContextOptions: Map<string, Set<string>>;

    heksherClient: AxiosInstance;
    processingCallback: (p: Promise<any> | null) => void;
    onRuleChange: (r: RuleBranch) => void;
};

export function RulesView(props: RulesViewProps) {
    const [partialContext, setPartialContext] = useState(new Map<string, string>());
    const [valueViewDialogProps, setValueViewDialogProps] = useState<{
        title: string;
        element: JSX.Element;
    } | null>(null);
    /**
     this is always either an empty object or null
     */
    const [valueEditDialogNewProps, setValueEditDialogNewProps] = useState<Record<string, never> | null>(null);
    const [valueEditDialogExistingProps, setValueEditDialogExistingProps] = useState<{
        rule_id: number;
        rule_value: any;
        rule_context: Map<string, string>;
    } | null>(null);

    const [valueEditDialogValue, setValueEditDialogValue] = useState<any>(null);
    const [valueEditDialogContext, setValueEditDialogContext] = useState<Map<string, string>>(new Map());
    const [valueEditDialogInfo, setValueEditDialogInfo] = useState<string>('');

    const { enqueueSnackbar } = useSnackbar();

    const [confirmationDialogProps, setConfirmationDialogProps] = useState<{
        title: string;
        text: string;
        callback: () => void;
    } | null>(null);

    const [valueFilter, setValueFilter] = useState<string>('');

    useEffect(() => {
        setPartialContext(props.initialContextFilter ?? new Map<string, string>());
    }, [props.initialContextFilter]);

    const valueFilterFunction = useMemo<[(value: any) => any, string | null]>(() => {
        if (valueFilter === '') {
            return [() => true, null];
        }
        try {
            return [
                Function(
                    'value',
                    `"use strict";` +
                        `try{return ${valueFilter}}` +
                        `catch(e){console.warn("error when evaluating value filter", e); return true}`,
                ) as (value: any) => any,
                null,
            ];
        } catch (e) {
            return [() => true, e.message];
        }
    }, [valueFilter]);

    const applicableRules = useMemo(
        () =>
            getPotentialRules(props.rules, props.setting.configurableFeatures, partialContext, valueFilterFunction[0]),
        [partialContext, props.setting, props.rules, valueFilterFunction],
    );

    const handleEditClick = (rule: PotentialRule) => () => {
        setValueEditDialogExistingProps({
            rule_id: rule.rule.rule_id,
            rule_value: rule.rule.value,
            rule_context: rule.rule.context_features,
        });
    };

    const handleDeleteClick = (rule: PotentialRule) => () => {
        setConfirmationDialogProps({
            title: `Delete rule #${rule.rule.rule_id}?`,
            text:
                Array.from(rule.rule.context_features)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ') +
                ' => ' +
                props.setting.type.Format(rule.rule.value),
            callback: () => {
                const promise = props.heksherClient
                    .delete('/api/v1/rules/' + rule.rule.rule_id)
                    .then(() => {
                        const newBranch = ruleBranchCopy(props.rules);
                        removeRule(newBranch, rule.rule, props.setting.configurableFeatures);
                        props.onRuleChange(newBranch);
                        enqueueSnackbar(`Rule ${rule.rule.rule_id} deleted`, { variant: 'success' });
                    })
                    .catch((err) => {
                        if (err.response) {
                            console.log('Error deleting rule:', err.response, err.response.data);
                        } else {
                            console.log('Error deleting rule:', err, err.message);
                        }
                        enqueueSnackbar('Error deleting rule, see log for details', { variant: 'error' });
                    })
                    .finally(() => {
                        props.processingCallback(null);
                    });
                props.processingCallback(promise);
            },
        });
    };

    const rules = getRules(props.rules);

    const context_options = new Map(props.setting.configurableFeatures.map((f) => [f, new Set<string>()]));
    for (const rule of rules) {
        for (const [feature, value] of rule.context_features.entries()) {
            context_options.get(feature)!.add(value);
        }
    }

    return (
        <>
            <Stack spacing={3}>
                <Card sx={{ p: '16px' }}>
                    <Typography variant='h2' color='text.primary'>
                        {props.setting.name}
                    </Typography>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Typography variant='body1'>Type:</Typography>
                        <div style={{ flexGrow: '1' }}>
                            <TruncChip value={props.setting.type.toString()} />
                        </div>
                    </div>
                    <Typography variant='body1'>
                        {'Configurable by: ' + props.setting.configurableFeatures.join(', ')}
                    </Typography>
                    <Typography variant='body2'>
                        {Array.from(props.setting.metadata.entries())
                            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                            .join(', ')}
                    </Typography>
                    <ContextSelect
                        context_options={context_options}
                        stackProps={{ spacing: 1 }}
                        filterChangeCallback={(key, value) => {
                            const newVal = new Map(partialContext);
                            if (value === null) {
                                newVal.delete(key);
                            } else {
                                newVal.set(key, value);
                            }
                            setPartialContext(newVal);
                        }}
                        initialValue={partialContext}
                    />
                    <Accordion sx={{ my: 1 }}>
                        <AccordionSummary>
                            <Typography>Value Filter {}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Tooltip title='Enter here a javascript expression with the variable "value"'>
                                <TextField
                                    fullWidth
                                    label='Value Filter'
                                    error={valueFilterFunction[1] !== null}
                                    helperText={valueFilterFunction[1]}
                                    onChange={(event) => setValueFilter(event.target.value)}
                                />
                            </Tooltip>
                        </AccordionDetails>
                    </Accordion>
                </Card>
                <TransitionGroup>
                    {applicableRules.map((rule) => (
                        <Collapse
                            key={`${rule.rule.rule_id}_${props.setting.type.Format(rule.rule.value)}`}
                            style={{ padding: 3 }}
                        >
                            <RuleCard
                                potentialRule={rule}
                                setting={props.setting}
                                onValueClick={() =>
                                    setValueViewDialogProps({
                                        title:
                                            rule.rule.rule_id === -1 ? 'Default Value' : `Rule #${rule.rule.rule_id}`,
                                        element: props.setting.type.asViewElement(rule.rule.value),
                                    })
                                }
                                isDefault={rule.rule.rule_id === -1}
                                onEditClick={handleEditClick(rule)}
                                onDeleteClick={handleDeleteClick(rule)}
                            />
                        </Collapse>
                    ))}
                </TransitionGroup>
            </Stack>
            <ValueViewDialog
                open={valueViewDialogProps !== null}
                onClose={() => setValueViewDialogProps(null)}
                title={valueViewDialogProps?.title ?? ''}
            >
                {valueViewDialogProps !== null ? valueViewDialogProps?.element : null}
            </ValueViewDialog>
            {valueEditDialogNewProps !== null && (
                <ValueEditDialogNewContext
                    open={true}
                    onClose={(ok) => {
                        setValueEditDialogNewProps(null);
                        if (ok) {
                            const promise = props.heksherClient
                                .post<ModelAddRuleResponse>('/api/v1/rules', {
                                    setting: props.setting.name,
                                    feature_values: Object.fromEntries(valueEditDialogContext.entries()),
                                    value: valueEditDialogValue,
                                    metadata: {
                                        information: valueEditDialogInfo,
                                    },
                                })
                                .then((response) => {
                                    const rule_id = response.data.rule_id;
                                    const getPromise = props.heksherClient
                                        .get<ModelGetRule>('/api/v1/rules' + response.headers['location'])
                                        .then((get_response) => {
                                            const newRule = new RuleLeaf(get_response.data, rule_id);
                                            const newBranch = ruleBranchCopy(props.rules);
                                            AddRule(newBranch, newRule, props.setting.configurableFeatures);
                                            props.onRuleChange(newBranch);
                                            enqueueSnackbar(`Rule ${rule_id} added`, { variant: 'success' });
                                        })
                                        .catch((err) => {
                                            if (err.response) {
                                                console.log('Error fetching rule:', err.response, err.response.data);
                                            } else {
                                                console.log('Error fetching rule:', err, err.message);
                                            }
                                            enqueueSnackbar(
                                                `Error fetching new rule ${rule_id},` + ` see log for details`,
                                                { variant: 'error' },
                                            );
                                        })
                                        .finally(() => {
                                            props.processingCallback(null);
                                        });
                                    props.processingCallback(getPromise);
                                })
                                .catch((err) => {
                                    if (err.response) {
                                        console.log('Error creating rule:', err.response, err.response.data);
                                    } else {
                                        console.log('Error creating rule:', err, err.message);
                                    }
                                    enqueueSnackbar('Error creating rule, see log for details', { variant: 'error' });
                                    props.processingCallback(null);
                                });

                            props.processingCallback(promise);
                        }
                    }}
                    children_factory={(val, val_cb, err_cb) => props.setting.type.asEditElement(val, val_cb, err_cb)}
                    title={'Add Rule'}
                    initial_value={props.setting.default_value}
                    on_value_changed={(v) => setValueEditDialogValue(v)}
                    onContextChanged={(c) => setValueEditDialogContext(c)}
                    on_validity_changed={() => {}}
                    initialContext={partialContext}
                    contextOptions={
                        new Map(
                            Array.from(props.parentContextOptions.entries()).filter(
                                ([k]) => props.setting.configurableFeatures.indexOf(k) !== -1,
                            ),
                        )
                    }
                    existingRuleBranch={props.rules}
                    contextFeatures={props.setting.configurableFeatures}
                    onInfoChange={(s) => setValueEditDialogInfo(s)}
                />
            )}
            {valueEditDialogExistingProps !== null && (
                <ValueEditDialogConstContext
                    open={true}
                    onClose={(ok) => {
                        if (ok) {
                            // we turn dialog props to params here because the dialog props will be deleted before the
                            // promise ends
                            const handleRuleEdit = (ruleId: number) => {
                                const promise = props.heksherClient
                                    .put('/api/v1/rules/' + ruleId + '/value', {
                                        value: valueEditDialogValue,
                                    })
                                    .then(() => {
                                        const getPromise = props.heksherClient
                                            .get<ModelGetRule>('/api/v1/rules/' + ruleId)
                                            .then((response) => {
                                                const newRule = new RuleLeaf(response.data, ruleId);
                                                const newBranch = ruleBranchCopy(props.rules);
                                                ReplaceRule(newBranch, newRule, props.setting.configurableFeatures);
                                                props.onRuleChange(newBranch);
                                                enqueueSnackbar(`Rule ${ruleId} updated`, { variant: 'success' });
                                            })
                                            .catch((err) => {
                                                if (err.response) {
                                                    console.log(
                                                        'Error fetching rule:',
                                                        err.response,
                                                        err.response.data,
                                                    );
                                                } else {
                                                    console.log('Error fetching rule:', err, err.message);
                                                }
                                                enqueueSnackbar(
                                                    `Error fetching updated rule ${ruleId},` + ` see log for details`,
                                                    { variant: 'error' },
                                                );
                                            })
                                            .finally(() => {
                                                props.processingCallback(null);
                                            });
                                        props.processingCallback(getPromise);
                                    })
                                    .catch((err) => {
                                        if (err.response) {
                                            console.log('Error editing rule:', err.response, err.response.data);
                                        } else {
                                            console.log('Error editing rule:', err, err.message);
                                        }
                                        props.processingCallback(null);
                                        enqueueSnackbar('Error editing rule, see log for details', {
                                            variant: 'error',
                                        });
                                    });
                                props.processingCallback(promise);
                            };
                            handleRuleEdit(valueEditDialogExistingProps!.rule_id);
                        }
                        setValueEditDialogExistingProps(null);
                    }}
                    children_factory={(val, val_cb, err_cb) => props.setting.type.asEditElement(val, val_cb, err_cb)}
                    title={`Edit Rule: ${valueEditDialogExistingProps.rule_id}`}
                    initial_value={valueEditDialogExistingProps.rule_value}
                    on_value_changed={(v) => setValueEditDialogValue(v)}
                    on_validity_changed={() => {}}
                    initialContext={valueEditDialogExistingProps.rule_context}
                    existingRuleBranch={props.rules}
                    contextFeatures={props.setting.configurableFeatures}
                />
            )}
            {confirmationDialogProps !== null && (
                <ConfirmDialog
                    title={confirmationDialogProps.title}
                    handleConfirm={confirmationDialogProps.callback}
                    handleClose={() => setConfirmationDialogProps(null)}
                >
                    {confirmationDialogProps.text}
                </ConfirmDialog>
            )}
            <Fab
                onClick={() => setValueEditDialogNewProps({})}
                style={{
                    position: 'absolute',
                    top: 30,
                    right: 30,
                }}
            >
                <AddIcon />
            </Fab>
        </>
    );
}
