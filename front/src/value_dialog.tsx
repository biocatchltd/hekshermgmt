import {ReactNode} from "react";
import {Dialog, DialogContent, DialogTitle, Paper, PaperProps} from "@mui/material";
import Draggable from "react-draggable";
import * as React from "react";

type ValueModalProps = {
    open: boolean;
    onClose: () => void,
    children: ReactNode;
    title: string;
}

function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
        >
            {/* todo an issue right now is that nested dialogs all drag together, I don't care about this right now*/}
            <Paper {...props} />
        </Draggable>
    );
}

export function ValueDialog(props: ValueModalProps) {
    return <Dialog open={props.open}
                   onClose={
                       props.onClose
                   }
                   PaperComponent={PaperComponent}
                   aria-labelledby="draggable-dialog-title"
                   transitionDuration={{'exit': 0}}
    >
        <DialogTitle style={{cursor: 'move'}} id="draggable-dialog-title">
            {props.title}
        </DialogTitle>
        <DialogContent>
            <div>
                {props.children}
            </div>
        </DialogContent>
    </Dialog>;
}