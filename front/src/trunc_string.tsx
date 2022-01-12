import * as React from "react";
import {Backdrop, Box, Button, Card, Icon, IconButton, Popover, SxProps, Theme, Typography} from "@mui/material";
import {Fragment, Ref, RefObject} from "react";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {ShortString} from "./short_string";

type ShortStringProps = {
    value: string;
    sx?: SxProps<Theme>;
}

type ShortStringState = {
    overflow: boolean;
}

export class TruncString extends React.Component<ShortStringProps, ShortStringState> {
    span: HTMLElement | null
    ref: RefObject<any>

    constructor(props: ShortStringProps) {
        super(props);
        this.ref = React.createRef();
        this.state = {
            overflow: false,
        };
    }

    isEllipsisActive(e: HTMLElement): boolean {
        return e.offsetHeight < e.scrollHeight || e.offsetWidth < e.scrollWidth;
    }

    componentDidMount() {
        this.setState({overflow: this.isEllipsisActive(this.span!)});
        const element = this.span!;
        element.addEventListener('resize', (event:any) => console.log(event.detail));
        function checkResize(mutations:any) {
            const el = mutations[0].target;
            const w = el.clientWidth;
            const h = el.clientHeight;

            const isChange = mutations
                .map((m:any) => `${m.oldValue}`)
                .some((prev:any) => prev.indexOf(`width: ${w}px`) === -1 || prev.indexOf(`height: ${h}px`) === -1);

            const event = new CustomEvent('resize', { detail: { width: w, height: h } });
            el.dispatchEvent(event);
        }
        const observer = new MutationObserver(checkResize);
        observer.observe(element, { attributes: true, attributeOldValue: true, });
    }

    render() {
        return (
            <div style={{ position: "relative", height: "20px" }}  ref={this.ref}>
            <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                boxSizing: "border-box",
                display: "block",
                width: "100%"
            }} >
                <div
                    style={{
                        boxSizing: "border-box",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                    ref={ref => (this.span = ref)}
                >
                    {/*{this.state.overflow ?
                    <ShortString value={this.props.value} sx={this.props.sx ?? {}}/>
                    : <Box sx={this.props.sx}><Typography>{this.props.value}</Typography></Box>
                    }*/}
                    <div>{"Triggered: " + this.state.overflow}</div>
                    <span>This is a long text that activates ellipsis ddddddddddddddd</span>
                </div>
            </div>
            </div>
        );
    }
}