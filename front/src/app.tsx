import { useState } from 'react';
import { ThemeProvider } from '@mui/styles';
import { Backdrop, CircularProgress, Button, Box } from '@mui/material';
import * as React from 'react';
import { createTheme } from '@mui/material/styles';
import { SettingsView } from './settingsView';
import { About } from './about';
import { SnackbarProvider } from 'notistack';

export type BannerProps = {
    text: string;
    color: string;
    textColor: string;
};

function Banner(props: BannerProps) {
    return (
        <Box
            sx={{
                width: 1,
                mb: 1,
                py: 1,
                pl: 3,
                backgroundColor: props.color,
                color: props.textColor,
            }}
        >
            {props.text}
        </Box>
    );
}

export function App() {
    /**
     * we use a "global" processing variable that can cover the entire app with a backdrop until completed.
     * note that all promises sent here should automatically remove/replace themselves when done.
     */
    const [processing, setProcessing] = useState<Promise<any> | null>(null);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [bannerProps, setBannerProps] = useState<BannerProps | null>(null);

    const theme = createTheme();

    return (
        <ThemeProvider theme={theme}>
            <SnackbarProvider maxSnack={3}>
                {bannerProps && <Banner {...bannerProps} />}
                <Backdrop open={processing !== null} sx={{ zIndex: 1300 }}>
                    <CircularProgress />
                </Backdrop>
                <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
                <SettingsView setProcessing={setProcessing} setBannerProps={setBannerProps} />
                <Button onClick={() => setAboutOpen(true)}>About</Button>
            </SnackbarProvider>
        </ThemeProvider>
    );
}
