import {useState} from "react";
import {ThemeProvider} from "@mui/styles";
import {Backdrop, CircularProgress, Button} from "@mui/material";
import * as React from "react";
import {createTheme} from "@mui/material/styles";
import {SettingsView} from "./settings_view";
import {About} from "./about";

export function App() {
    const [processing, setProcessing] = useState<Promise<any> | null>(null);
    const [aboutOpen, setAboutOpen] = useState(false);

    return (
        <ThemeProvider theme={createTheme()}>
            <Backdrop open={processing !== null} sx={{zIndex: 1300}}>
                <CircularProgress/>
            </Backdrop>
            <About open={aboutOpen} onClose={()=>setAboutOpen(false)}/>
            <SettingsView setProcessing={setProcessing}/>
            <Button onClick={()=>setAboutOpen(true)}>About</Button>
        </ThemeProvider>
    )
}