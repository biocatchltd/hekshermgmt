import * as React from "react";
import {Box, SxProps, Theme, Typography, Stack, Chip, ChipProps} from "@mui/material";
import {HiddenString} from "./hidden_string";
// @ts-ignore
import {OverflowDetector} from 'react-overflow';


type ShortStringProps = {
    value: string;
    sx?: ChipProps;
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

                            <OverflowDetector onOverflowChange={(a: boolean) => {
                                this.setState({overflow: a});
                            }}>
                                <Chip {...this.props.sx} label={this.props.value} />
                                {/*<div>{"Triggered: " + this.state.overflow}</div>
                                <span>This is a long text that activates ellipsis ddddddddddddddd</span>*/}
                            </OverflowDetector>
                        </Box>
                    </Box>
                </Box>
                {this.state.overflow && <HiddenString value={this.props.value}/>}
            </Stack>
        );
    }
}