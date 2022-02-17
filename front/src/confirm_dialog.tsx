import {ReactNode} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";

type ConfirmDialogProps = {
    title: string
    children: ReactNode
    handleConfirm: () => void
    handleClose: () => void
}

export function ConfirmDialog(props: ConfirmDialogProps){
    return <Dialog open={true}>
        <DialogTitle>
            {props.title}
        </DialogTitle>
        <DialogContent>
            {props.children}
        </DialogContent>
        <DialogActions>
          <Button onClick={props.handleClose}>Cancel</Button>
          <Button onClick={() => {
              props.handleClose();
              props.handleConfirm();
          }} autoFocus>
            OK
          </Button>
        </DialogActions>
    </Dialog>
}