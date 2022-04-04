import { PotentialRule } from './potential_rules';
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { ValueViewDialog } from './value_dialog';
import { SettingType } from './setting_type';

type RuleOptionsViewProps = {
    options: PotentialRule[];
    type: SettingType<any>;
};

/**
 * This is the dialog that happens when you click on the "X Options" in the value preview.
 */
export function RuleOptionsView(props: RuleOptionsViewProps) {
    const [dialogTarget, setDialogTarget] = useState<PotentialRule | null>(null);

    return (
        <>
            <List>
                {props.options.map((r) => (
                    <ListItem key={r.rule.value}>
                        <ListItemText primary={r.get_assumptions_string()} />
                        <ListItemButton onClick={() => setDialogTarget(r)}>
                            <ListItemText primary={props.type.Format(r.rule.value)} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <ValueViewDialog
                open={dialogTarget !== null}
                onClose={() => setDialogTarget(null)}
                title={dialogTarget?.get_assumptions_string() ?? ''}
                export={JSON.stringify(dialogTarget?.rule.value)}
            >
                {dialogTarget !== null ? props.type.asViewElement(dialogTarget.rule.value) : null}
            </ValueViewDialog>
        </>
    );
}
