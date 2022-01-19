import {ReactNode, useState} from "react";
import {TruncChip} from "./trunc_string";
import {Box, Modal} from "@mui/material";
import * as React from "react";

type ValueViewProps = {
    open: boolean;
    setOpen: (open: boolean) => void,
    expandedElement: ReactNode;
    children: ReactNode;
}

export function ValueView(props: ValueViewProps) {
    return <>
        {props.children}
        <Modal open={props.open} onClose={() => props.setOpen(false)}>
            <Box sx={{
                position: 'absolute' as 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                border: '2px solid #000',
                boxShadow: 24,
                p: 4,
            }}>
                {props.expandedElement}
            </Box>
        </Modal>
    </>
}