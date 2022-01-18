import {Setting} from "./setting";
import {RuleBranch} from "./potential_rules";
import * as React from "react";
import {Card, Typography} from "@mui/material";

type SettingViewProps = {
    setting: Setting;
    rules: RuleBranch;
    initial_partial_context?: Map<string, string>
};

type SettingViewState = {
    partial_context: Map<string, string>;
};

export class SettingView extends React.Component<SettingViewProps, SettingViewState> {
    constructor(props: SettingViewProps) {
        super(props);
        this.state = {
            partial_context: props.initial_partial_context || new Map<string, string>()
        };
    }

    render() {
        return (
            <>
                <Card>
                    <Typography variant='h1' color="text.primary">{this.props.setting.name}</Typography>
                </Card>
            </>
        )
    }
}