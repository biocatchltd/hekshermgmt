import { useState } from 'react';
import { ThemeProvider } from '@mui/styles';
import { Backdrop, CircularProgress, Button, Box } from '@mui/material';
import * as React from 'react';
import { createTheme } from '@mui/material/styles';
import { SettingsView } from './settings_view';
import { About } from './about';
import { SnackbarProvider } from 'notistack';

export function App() {
    /**
     * we use a "global" processing variable that can cover the entire app with a backdrop until completed.
     * note that all promises sent here should automatically remove/replace themselves when done.
     */
    const [processing, setProcessing] = useState<Promise<any> | null>(null);
    const [aboutOpen, setAboutOpen] = useState(false);

    return (
        <ThemeProvider theme={createTheme()}>
            <SnackbarProvider maxSnack={3}>
                {process.env.REACT_APP_BANNER_TEXT && (
                    <Box
                        sx={{
                            width: 1,
                            mb: 1,
                            py: 1,
                            pl: 3,
                            backgroundColor: process.env.REACT_APP_BANNER_COLOR ?? 'yellow',
                            color: process.env.REACT_APP_BANNER_TEXT_COLOR ?? 'black',
                        }}
                    >
                        {process.env.REACT_APP_BANNER_TEXT}
                    </Box>
                )}
                <Backdrop open={processing !== null} sx={{ zIndex: 1300 }}>
                    <CircularProgress />
                </Backdrop>
                <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
                <SettingsView setProcessing={setProcessing} />
                <Button onClick={() => setAboutOpen(true)}>About</Button>
            </SnackbarProvider>
        </ThemeProvider>
    );
}
