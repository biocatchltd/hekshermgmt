import {Dialog, DialogContent, DialogTitle, Link,} from "@mui/material";
import * as React from "react";
import FavoriteIcon from '@mui/icons-material/Favorite';

type AboutProps = {
    open: boolean;
    onClose: () => void;
};

export function About(props: AboutProps) {
    return <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle>Heksher Management v{process.env.REACT_APP_VERSION}</DialogTitle>
        <DialogContent>
            Learn more about Heksher <Link href="https://github.com/biocatchltd/Heksher" target="_blank">here</Link><br/>
            From <Link href="https://github.com/biocatchltd" target="_blank">Biocatch</Link> with <FavoriteIcon/><br/>
            <br/>
            <Link href="https://github.com/biocatchltd/hekshermgmt" target="_blank">Source for this site</Link>
        </DialogContent>
    </Dialog>
}