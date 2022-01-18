import {Setting} from "./setting";
import {RuleBranch} from "./potential_rules";
import * as React from "react";
import {Card, Stack, Typography} from "@mui/material";
import {TruncChip} from "./trunc_string";

type RulesViewProps = {
    setting: Setting;
    rules: RuleBranch;
    initialContextFilter?: string;
};

export function RulesView(props: RulesViewProps) {
    const [partialContext, setPartialContext] = React.useState(props.initialContextFilter
        ?? new Map<string, string>());

    return (
        <>
            <Card>
                <Typography variant='h2' color="text.primary">{props.setting.name}</Typography>
                <Stack direction='row'>
                    <Typography>Type:</Typography>
                    <TruncChip value={props.setting.type.toString()}/>
                </Stack>

            </Card>
        </>
    )

}