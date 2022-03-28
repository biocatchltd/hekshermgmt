import {useState} from "react";
import {ThemeProvider} from "@mui/styles";
import {Backdrop, CircularProgress} from "@mui/material";
import * as React from "react";
import {createTheme} from "@mui/material/styles";
import {SettingsView} from "./settings_view";

export function App() {
    const [processing, setProcessing] = useState<Promise<any> | null>(null);

    return (
        // @ts-ignore
        <ThemeProvider theme={createTheme()}>
            <Backdrop open={processing !== null} sx={{zIndex: 1300}}>
                <CircularProgress/>
            </Backdrop>
            <SettingsView setProcessing={setProcessing}/>
        </ThemeProvider>
    )
}