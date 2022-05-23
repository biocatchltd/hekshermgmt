import { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import * as React from 'react';

type ConfirmDialogProps = {
    title: string;
    children: ReactNode;
    handleConfirm: () => void;
    handleClose: () => void;
    allowConfirm?: boolean;
};

/**
 * A generic confirmation dialog to approve an action
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
    return (
        <Dialog open={true}>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogContent>{props.children}</DialogContent>
            <DialogActions>
                <Button onClick={props.handleClose}>Cancel</Button>
                <Button
                    onClick={() => {
                        props.handleClose();
                        props.handleConfirm();
                    }}
                    autoFocus
                    disabled={!(props.allowConfirm ?? true)}
                >
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}
