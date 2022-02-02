import {Setting} from "./setting";
import {AddRule, getPotentialRules, getRules, PotentialRule, RuleBranch, RuleLeaf} from "./potential_rules";
import * as React from "react";
import {Card, Stack, Typography, Collapse, Link, Fab} from "@mui/material";
import {TruncChip} from "./trunc_string";
import {ContextSelect} from "./context_select";
import {TransitionGroup} from "react-transition-group";
import {ValueEditDialogNewContext, ValueViewDialog} from "./value_dialog";
import AddIcon from '@mui/icons-material/Add';
import {useEffect, useState} from "react";
import {AxiosInstance} from "axios";
import {ModelGetRule} from "./index";

interface ModelAddRuleResponse {
    rule_id: number
}

type RuleCardProps = {
    setting: Setting,
    potentialRule: PotentialRule;
    onValueClick: () => void;
}

function RuleCard(props: RuleCardProps) {
    return <Card sx={{p: '16px'}}>
        <Link variant="h6" underline="hover"
              onClick={props.onValueClick}>{props.setting.type.Format(props.potentialRule.rule.value)}</Link>
        {props.potentialRule.rule.rule_id === -1 ?
            <Typography variant="body1">Setting Default</Typography>
            :
            <>
                <Typography variant="body1">{props.potentialRule.get_assumptions_string()}</Typography>
                <Typography variant="body2">
                    {
                        Array.from(props.potentialRule.rule.metadata.entries()).map(([k, v]) => `${k}: ${JSON.stringify(v)}, `).join("") + `<id>: ${props.potentialRule.rule.rule_id}`
                    }
                </Typography>
            </>
        }
    </Card>
}

type RulesViewProps = {
    setting: Setting;
    rules: RuleBranch;
    initialContextFilter: Map<string, string> | undefined;
    parentContextOptions: Map<string, Set<string>>

    heksherClient: AxiosInstance
    processingCallback: (p: Promise<any> | null) => void;
    onRuleChange: (r: RuleBranch) => void;
};


export function RulesView(props: RulesViewProps) {
    const [partialContext, setPartialContext] = useState(props.initialContextFilter
        ?? new Map<string, string>());
    const [valueViewDialogProps, setValueViewDialogProps] = useState<{
        title: string
        element: JSX.Element,
    } | null>(null);
    const [valueEditDialogProps, setValueEditDialogProps] = useState<{} | null>(null);

    const [valueEditDialogValue, setValueEditDialogValue] = useState<any>(null);
    const [valueEditDialogContext, setValueEditDialogContext] = useState<Map<string, string>>(new Map())
    const [valueEditDialogInfo, setValueEditDialogInfo] = useState<string>("");

    const [applicableRules, setApplicableRules] = useState<PotentialRule[]>([]);

    useEffect(()=>{
        setApplicableRules(getPotentialRules(props.rules, props.setting.configurableFeatures, partialContext));
    }, [partialContext])

    const rules = getRules(props.rules);

    const context_options = new Map(props.setting.configurableFeatures.map(f => [f, new Set<string>()]));
    for (let rule of rules) {
        for (let [feature, value] of rule.context_features.entries()) {
            context_options.get(feature)!.add(value);
        }
    }

    return (
        <>
            <Stack spacing={3}>
                <Card sx={{p: '16px'}}>
                    <Typography variant='h2' color="text.primary">{props.setting.name}</Typography>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        <Typography variant="body1">Type:</Typography>
                        <div style={{'flexGrow': '1'}}><TruncChip value={props.setting.type.toString()}/></div>
                    </div>
                    <Typography
                        variant="body1">{"Configurable by: " + props.setting.configurableFeatures.join(", ")}</Typography>
                    <Typography variant="body2">{
                        Array.from(props.setting.metadata.entries()).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")
                    }</Typography>
                    <ContextSelect context_options={context_options} stackProps={{spacing: 1}}
                                   filterChangeCallback={(key, value) => {
                                       let newVal = new Map(partialContext);
                                       if (value === null) {
                                           newVal.delete(key);
                                       } else {
                                           newVal.set(key, value);
                                       }
                                       setPartialContext(newVal);
                                   }} initialValue={partialContext}/>

                </Card>
                <TransitionGroup>
                    {applicableRules.map(rule =>
                        <Collapse key={rule.rule.rule_id} style={{padding: 3}}>
                            <RuleCard potentialRule={rule} setting={props.setting}
                                      onValueClick={() => setValueViewDialogProps({
                                          title: rule.rule.rule_id === -1 ? "Default Value" : `Rule #${rule.rule.rule_id}`,
                                          element: props.setting.type.asViewElement(rule.rule.value)
                                      })}/>
                        </Collapse>
                    )}
                </TransitionGroup>
            </Stack>
            <ValueViewDialog open={valueViewDialogProps !== null} onClose={() => setValueViewDialogProps(null)}
                             title={valueViewDialogProps?.title ?? ""}>
                {valueViewDialogProps !== null ? valueViewDialogProps?.element : null}
            </ValueViewDialog>
            {valueEditDialogProps !== null && <ValueEditDialogNewContext
                open={true}
                onClose={(ok) => {
                    setValueEditDialogProps(null)
                    if (ok) {
                        let promise = props.heksherClient.post<ModelAddRuleResponse>('/api/v1/rules', {
                            setting: props.setting.name,
                            feature_values: Object.fromEntries(valueEditDialogContext.entries()),
                            value: valueEditDialogValue,
                            metadata: {
                                information: valueEditDialogInfo,
                            },
                        }).then((response) => {
                            let rule_id = response.data.rule_id;
                            let getPromise = props.heksherClient.get<ModelGetRule>(
                                '/api/v1/rules'+response.headers['location']).then(
                                (response) => {
                                    let newRule = new RuleLeaf(response.data, rule_id);
                                    let newBranch = props.rules;
                                    AddRule(newBranch, newRule, props.setting.configurableFeatures);
                                    props.onRuleChange(newBranch)
                                    props.processingCallback(null)
                                }
                            )
                            props.processingCallback(getPromise);
                        }).catch((err)=>{
                            if (err.response){
                                console.log('Error creating rule:', err.response, err.response.data)
                            }
                            else{
                                console.log('Error creating rule:', err, err.message)
                            }
                        })

                        props.processingCallback(promise);
                    }
                }}
                children_factory={
                    (val, val_cb, err_cb) => props.setting.type.asEditElement(val, val_cb, err_cb)
                }
                title={"Add Rule"}
                initial_value={props.setting.default_value}
                on_value_changed={(v) => setValueEditDialogValue(v)}
                onContextChanged={(c) => setValueEditDialogContext(c)}
                on_validity_changed={() => {
                }}
                initialContext={partialContext}
                contextOptions={new Map(Array.from(props.parentContextOptions.entries()).filter(
                    ([k, v]) => props.setting.configurableFeatures.indexOf(k) !== -1)
                )}
                existingRuleBranch={props.rules}
                contextFeatures={props.setting.configurableFeatures}
                onInfoChange={(s) => setValueEditDialogInfo(s)}
            />}
            <Fab onClick={() => setValueEditDialogProps({})}
                 style={{
                     position: "absolute",
                     top: 30,
                     right: 30,
                 }}
            >
                <AddIcon/>
            </Fab>
        </>
    )

}