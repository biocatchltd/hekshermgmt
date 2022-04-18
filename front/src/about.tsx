import { Dialog, DialogContent, DialogTitle, Link, Box, Typography } from '@mui/material';
import * as React from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { DialogProps } from '@mui/material/Dialog/Dialog';

type AboutProps = DialogProps;

export function About(props: AboutProps) {
    return (
        <Dialog {...props}>
            <DialogTitle>
                Heksher Management v{process.env.REACT_APP_VERSION}
                {process.env.NODE_ENV !== 'production' && ` (${process.env.NODE_ENV} mode)`}
            </DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                    }}
                >
                    <Typography>
                        From&nbsp;
                        <Link href='https://github.com/biocatchltd' target='_blank'>
                            Biocatch
                        </Link>
                        &nbsp;with&nbsp;
                        <FavoriteIcon />
                    </Typography>
                    <Typography>
                        Learn more about Heksher&nbsp;
                        <Link href='https://github.com/biocatchltd/Heksher' target='_blank'>
                            here
                        </Link>
                    </Typography>
                    <Typography
                        sx={{
                            my: 2,
                        }}
                    >
                        <Link href='https://github.com/biocatchltd/hekshermgmt' target='_blank'>
                            Source for this site
                        </Link>
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
