import * as React from "react";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {Box, Drawer, DrawerProps, Fab, Portal} from "@mui/material";
import {useRef} from "react";

type ResizableDrawerProps = {
    minWidth: number;
    maxWidth: number;
    children: React.ReactNode;
    drawerProps?: DrawerProps;
    onWidthChange?: (width: number) => void;
};

type ResizableDrawerState = {
    width: number;
};

const INITAL_WIDTH = 300;

export class ResizableDrawer extends React.Component<ResizableDrawerProps, ResizableDrawerState> {
    constructor(props: ResizableDrawerProps) {
        super(props);
        this.state = {
            width: INITAL_WIDTH,
        };
    }

    componentDidMount() {
        if (this.props.onWidthChange){
            this.props.onWidthChange(this.state.width);
        }
    }

    handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const onMouseMove = (e: MouseEvent) => {
            const newWidth = document.body.offsetWidth - e.clientX;
            console.log(e.clientX, document.body.offsetWidth, newWidth);
            if (newWidth >= this.props.minWidth && newWidth <= this.props.maxWidth) {
                this.setState({width: newWidth});
                if (this.props.onWidthChange) {
                    this.props.onWidthChange(newWidth);
                }
            }
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    render() {
        return (
            <Drawer
                sx={{flexShrink: 0}}
                PaperProps={{style: {width: this.state.width}}}
                {...this.props.drawerProps}
            >
                <div onMouseDown={e => this.handleMouseDown(e)} style={{
                    width: "5px",
                    cursor: "ew-resize",
                    padding: "4px 0 0",
                    borderTop: "1px solid #ddd",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    zIndex: 100,
                    backgroundColor: "#f4f7f9"
                }}/>
                {this.props.children}
            </Drawer>
        )
    }
}