import * as React from "react";
import {Box, Stack, Chip, ChipProps, Tooltip} from "@mui/material";
import {HiddenString} from "./hidden_string";
import DetectableOverflow from "react-detectable-overflow";


type ShortStringProps = {
    value: string;
    tooltip?: string;
    chip_props?: ChipProps;
}

type ShortStringState = {
    overflow: boolean;
}

export class TruncChip extends React.Component<ShortStringProps, ShortStringState> {
    span: any

    constructor(props: ShortStringProps) {
        super(props);
        this.state = {
            overflow: false,
        };
    }

    isEllipsisActive(e: HTMLElement): boolean {
        return e.offsetHeight < e.scrollHeight || e.offsetWidth < e.scrollWidth;
    }

    componentDidMount() {
        this.setState({overflow: this.isEllipsisActive(this.span!)});
    }

    render() {
        let chip = <Chip {...this.props.chip_props} label={this.props.value} />;

        let inner_element = (this.props.tooltip !== undefined) ?
            <Tooltip title={
                <span style={{ whiteSpace: 'pre-line' }}>
                {this.props.tooltip}
                </span>
            }>{chip}</Tooltip> :
            chip;

        return (
            <Stack direction="row" justifyContent="flex-end" alignItems="center">
                <Box style={{position: "relative", height: "20px", width: "100%"}}>
                    <Box style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        boxSizing: "border-box",
                        display: "block",
                        width: "100%"
                    }}>
                        <Box
                            style={{
                                boxSizing: "border-box",
                                overflow: "hidden",
                                textOverflow: "",
                                whiteSpace: "nowrap",
                            }}
                            ref={ref => (this.span = ref)}
                        >

                            <DetectableOverflow onChange={(a: boolean) => {
                                this.setState({overflow: a});
                            }}>
                                {inner_element}
                            </DetectableOverflow>
                        </Box>
                    </Box>
                </Box>
                {this.state.overflow && <HiddenString value={this.props.value}/>}
            </Stack>
        );
    }
}