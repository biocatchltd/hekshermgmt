import * as React from 'react';
import { Box, IconButton, Popover, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type ShortStringProps = {
    value: string;
};

type ShortStringState = {
    isOpen: boolean;
    popAnchor: HTMLButtonElement | null;
};

export function HiddenString(props: ShortStringProps) {
    const [state, setState] = React.useState<ShortStringState>({ isOpen: false, popAnchor: null });

    const copyContent = () => {
        navigator.clipboard.writeText(props.value);
    };

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setState({ isOpen: true, popAnchor: event.currentTarget });
    };

    const handleClose = () => {
        setState({ isOpen: false, popAnchor: null });
    };

    const containerRef = React.useRef();

    return (
        <Box ref={containerRef}>
            <IconButton onClick={handleOpen} size='small'>
                <ExpandMoreIcon />
            </IconButton>
            <Popover
                open={state.isOpen}
                onClick={handleClose}
                anchorEl={state.popAnchor!}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                container={containerRef.current}
            >
                <Box sx={{ padding: '5px' }}>
                    <Typography>
                        {props.value}
                        <IconButton onClick={copyContent}>
                            <ContentCopyIcon />
                        </IconButton>
                    </Typography>
                </Box>
            </Popover>
        </Box>
    );
}
