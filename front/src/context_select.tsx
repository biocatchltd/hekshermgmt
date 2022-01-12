import * as React from "react";
import {Fragment} from "react";
import {Autocomplete, Stack, TextField} from "@mui/material";
import {Main} from "./index";

type ContextSelectProps = {
    context_options: {[key:string]: Set<string>}
    owner: Main
}

type ContextSelectState = {
    selected_options: {[key:string]: string | null}
}

export class ContextSelect extends React.Component<ContextSelectProps, ContextSelectState>{
    constructor(props: ContextSelectProps){
        super(props);
        let selected_options: {[key:string]: string | null} = {};
        for (let key in this.props.context_options){
            selected_options[key] = null;
        }
        this.state = {
            selected_options: selected_options
        }
    }
    render() {
        return (
            <Stack direction="row" justifyContent="space-evenly"  >
                {Object.entries(this.props.context_options).map(([key, values]) => {
                    return (
                        <Autocomplete key={key} style={{flexDirection: 'row', width:'100%', flex:1}}
                            renderInput={(params) => <TextField {...params} label={key} />}
                            options={["<none>", ...Array.from(values)]} sx={{ maxWidth: 300 }}
                            onChange={(event, value) => {
                                this.props.owner.set_context_filter(key, value)
                            }}
                        />
                    )
                })}
            </Stack>
        )
    }
}