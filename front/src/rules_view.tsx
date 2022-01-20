import {Setting} from "./setting";
import {getPotentialRules, getRules, PotentialRule, RuleBranch} from "./potential_rules";
import * as React from "react";
import {Card, Stack, Typography, Collapse, Link} from "@mui/material";
import {TruncChip} from "./trunc_string";
import {ContextSelect} from "./context_select";
import {TransitionGroup} from "react-transition-group";
import {ValueDialog} from "./value_dialog";

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
    initialContextFilter?: Map<string, string>;
};


export function RulesView(props: RulesViewProps) {
    const [partialContext, setPartialContext] = React.useState(props.initialContextFilter
        ?? new Map<string, string>());
    const [valueProps, setValueProps] = React.useState<{
        title: string
        element: JSX.Element,
    } | null>(null);

    const rules = getRules(props.rules);

    const context_options = new Map(props.setting.configurableFeatures.map(f => [f, new Set<string>()]));
    for (let rule of rules) {
        for (let [feature, value] of rule.context_features.entries()) {
            context_options.get(feature)!.add(value);
        }
    }

    const applicableRules = getPotentialRules(props.rules, props.setting.configurableFeatures, partialContext);

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
                            <RuleCard potentialRule={rule} setting={props.setting} onValueClick={() => setValueProps({
                                title: rule.rule.rule_id === -1 ? "Default Value" : `Rule #${rule.rule.rule_id}`,
                                element: props.setting.type.asViewElement(rule.rule.value)
                            })}/>
                        </Collapse>
                    )}
                </TransitionGroup>
            </Stack>
            <ValueDialog open={valueProps !== null} onClose={() => setValueProps(null)} title={valueProps?.title ?? ""}>
                {valueProps !== null ? valueProps?.element : null}
            </ValueDialog>
        </>
    )

}