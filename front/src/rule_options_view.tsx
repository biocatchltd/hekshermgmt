import {PotentialRule} from "./potential_rules";
import {List, ListItem, ListItemButton, ListItemText} from "@mui/material";
import * as React from "react";
import {useState} from "react";
import {ValueDialog} from "./value_dialog";
import {SettingType} from "./setting_type";

type RuleOptionsViewProps = {
    options: PotentialRule[];
    type: SettingType;
};

export function RuleOptionsView(props: RuleOptionsViewProps) {
    const [dialogTarget, setDialogTarget] = useState<PotentialRule | null>(null);

    return <>
        <List>
            {props.options.map(r =>
                <ListItem key={r.rule.value}>
                    <ListItemText primary={r.get_assumptions_string()}/>
                    <ListItemButton onClick={() => setDialogTarget(r)}>
                        <ListItemText primary={r.rule.value}/>
                    </ListItemButton>
                </ListItem>)}
        </List>
        <ValueDialog open={dialogTarget !== null} onClose={()=>setDialogTarget(null)} title={dialogTarget?.get_assumptions_string() ?? ""}>
            {dialogTarget !== null ? props.type.asViewElement(dialogTarget.rule.value): null}
        </ValueDialog>
    </>
}