import { Dialog, DialogContent, DialogTitle, Link } from '@mui/material';
import * as React from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { DialogProps } from '@mui/material/Dialog/Dialog';

export function About(props: DialogProps) {
    return (
        <Dialog {...props}>
            <DialogTitle>
                Heksher Management v{process.env.REACT_APP_VERSION}
                {process.env.NODE_ENV !== 'production' && ` (${process.env.NODE_ENV} mode)`}
            </DialogTitle>
            <DialogContent>
                From{' '}
                <Link href='https://github.com/biocatchltd' target='_blank'>
                    Biocatch
                </Link>{' '}
                with <FavoriteIcon />
                <br />
                Learn more about Heksher{' '}
                <Link href='https://github.com/biocatchltd/Heksher' target='_blank'>
                    here
                </Link>
                <br />
                <br />
                <Link href='https://github.com/biocatchltd/hekshermgmt' target='_blank'>
                    Source for this site
                </Link>
            </DialogContent>
        </Dialog>
    );
}
