import * as React from "react";
import {ChipProps, Chip, Tooltip, Card, Backdrop} from "@mui/material";

type ExpandChipProps = {
    value: string;
    tooltip: string;
    chip_props?: ChipProps;
}

export function ExpandChip(props: ExpandChipProps) {
    let chip = <Chip {...props.chip_props} label={props.value}/>;
    let tooltip_div = (<div style={{textAlign: "center"}}>
                <span style={{whiteSpace: 'pre-line'}}>
                    {props.tooltip}
                </span>
    </div>)
    return (
        <Tooltip title={tooltip_div}>{chip}</Tooltip>
    )
}