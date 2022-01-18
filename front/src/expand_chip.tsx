import * as React from "react";
import {ChipProps, Chip, Tooltip, Card, Backdrop} from "@mui/material";

type ExpandChipProps = {
    value: string;
    tooltip: string;
    chip_props?: ChipProps;
}

export function ExpandChip(props: ExpandChipProps){
    const [backdrop_open, set_backdrop_open] = React.useState(false);

    let chip = <Chip {...props.chip_props} label={props.value}
                     onClick={() => set_backdrop_open(true)}/>;
    let tooltip_div = (<div style={{textAlign: "center"}}>
                <span style={{whiteSpace: 'pre-line'}}>
                    {props.tooltip}
                </span>
                </div>)
    return (
        <>
            <Tooltip title={tooltip_div}>{chip}</Tooltip>
            <Backdrop open={backdrop_open}
                      onClick={() => set_backdrop_open(false)}
                      sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
                <Card sx={{'p': '10px'}} onClick={e => e.stopPropagation()}>
                    {tooltip_div}
                </Card>
            </Backdrop>
        </>
    )
}