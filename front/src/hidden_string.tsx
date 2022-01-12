import * as React from "react";
import {Backdrop, Box, Button, Card, Icon, IconButton, Popover, SxProps, Theme, Typography} from "@mui/material";
import {Fragment} from "react";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type ShortStringProps = {
    value: string;
}

type ShortStringState = {
    isOpen: boolean;
    popAnchor: HTMLButtonElement | null;
}

export class HiddenString extends React.Component<ShortStringProps, ShortStringState> {
    constructor(props: ShortStringProps) {
        super(props);
        this.state = {
            isOpen: false,
            popAnchor: null,
        };
    }

    handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        this.setState({isOpen: true, popAnchor: event.currentTarget});
    }

    handleClose = () => {
        this.setState({isOpen: false});
    }

    copyContent = () => {
        navigator.clipboard.writeText(this.props.value);
    }


    render() {
        return (
            <Fragment>
                <IconButton onClick={this.handleOpen}><ExpandMoreIcon/></IconButton>
                <Popover
                    open={this.state.isOpen}
                    onClick={this.handleClose}
                    anchorEl={this.state.popAnchor!}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    <Typography>
                        {this.props.value}
                        <IconButton onClick={this.copyContent}><ContentCopyIcon/></IconButton>
                    </Typography>
                </Popover>
            </Fragment>
        )
    }
}