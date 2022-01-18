import * as React from "react";
import {Box, Stack, Chip, ChipProps} from "@mui/material";
import {HiddenString} from "./hidden_string";
import DetectableOverflow from "react-detectable-overflow";
import {Fragment} from "react";


type TruncChipProps = {
    value: string;
    chip_props?: ChipProps;
}

type TruncChipState = {
    overflow: boolean;
}

export class TruncChip extends React.Component<TruncChipProps, TruncChipState> {
    constructor(props: TruncChipProps) {
        super(props);
        this.state = {
            overflow: false,
        };
    }

    render() {
        let chip = <Chip {...this.props.chip_props} label={this.props.value}/>;

        return (
            <Fragment>
                <Stack direction="row" justifyContent="flex" alignItems="center">
                    <Box style={{position: "relative", height: "20px", width: "100%"}}>
                        <Box style={{
                            position: "absolute",
                            right: 0,
                            left: 0,
                            boxSizing: "border-box",
                            display: "block",
                        }}>
                            <Box
                                style={{
                                    boxSizing: "border-box",
                                    overflowX: "hidden",
                                    textOverflow: "",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <DetectableOverflow onChange={(a: boolean) => {
                                    this.setState({overflow: a});
                                }}>
                                    {chip}
                                </DetectableOverflow>
                            </Box>
                        </Box>
                    </Box>
                    {this.state.overflow && <HiddenString value={this.props.value}/>}
                </Stack>
            </Fragment>
        );
    }
}