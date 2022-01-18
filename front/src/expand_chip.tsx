import * as React from "react";
import {ChipProps, Chip, Tooltip, Card, Backdrop} from "@mui/material";

type ExpandChipProps = {
    value: string;
    tooltip: string;
    chip_props?: ChipProps;
}

type ExpandChipState = {
    backdrop: boolean;
}

export class ExpandChip extends React.Component<ExpandChipProps, ExpandChipState> {
    constructor(props: ExpandChipProps) {
        super(props);
        this.state = {
            backdrop: false,
        };
    }

    render() {
        let chip = <Chip {...this.props.chip_props} label={this.props.value}
                         onClick={() => this.setState({backdrop: true})}/>;
        let tooltip_div = (<div style={{textAlign: "center"}}>
                    <span style={{whiteSpace: 'pre-line'}}>
                        {this.props.tooltip}
                    </span>
        </div>)
        return (
            <>
                <Tooltip title={tooltip_div}>{chip}</Tooltip>
                <Backdrop open={this.props.tooltip!==undefined && this.state.backdrop}
                          onClick={() => this.setState({'backdrop': false})}
                          sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
                    <Card sx={{'p': '10px'}} onClick={e => e.stopPropagation()}>
                        {tooltip_div}
                    </Card>
                </Backdrop>
            </>
        )
    }
}