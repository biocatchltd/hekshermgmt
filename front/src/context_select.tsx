import * as React from "react";
import {Fragment} from "react";
import {Autocomplete, Stack, TextField} from "@mui/material";
import {Main} from "./index";

type ContextSelectProps = {
    context_options: Map<string,Set<string>>
    owner: Main
}

type ContextSelectState = {
    selected_options: Map<string,string | null>
}

export class ContextSelect extends React.Component<ContextSelectProps, ContextSelectState>{
    constructor(props: ContextSelectProps){
        super(props);
        let selected_options: Map<string, string | null> = new Map();
        for(let key of this.props.context_options.keys()){
            selected_options.set(key, null);
        }
        this.state = {
            selected_options: selected_options
        }
    }
    render() {
        return (
            <Stack direction="row" justifyContent="space-evenly"  >
                {Array.from(this.props.context_options.entries()).map(([key, values]) => {
                    let options = Array.from(values);
                    options.sort();

                    return (
                        <Autocomplete key={key} style={{flexDirection: 'row', width:'100%', flex:1}}
                            renderInput={(params) => <TextField {...params} label={key} />}
                            options={["<none>", ...options]} sx={{ maxWidth: 300 }}
                            onChange={(event, value:string) => {
                                this.props.owner.set_context_filter(key, value)
                            }}
                        />
                    )
                })}
            </Stack>
        )
    }
}