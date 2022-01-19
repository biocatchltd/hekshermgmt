import * as React from "react";
import {Autocomplete, Stack, TextField} from "@mui/material";

type ContextSelectProps = {
    context_options: Map<string,Set<string>>
    filterChangeCallback: (key: string, value: string|null) => void
}

export function ContextSelect(props: ContextSelectProps){
    return (
            <Stack direction="row" justifyContent="space-evenly">
                {Array.from(props.context_options.entries()).map(([key, values]) => {
                    let options = Array.from(values);
                    options.sort();

                    return (
                        <Autocomplete key={key} style={{flexDirection: 'row', width:'100%', flex:1}}
                            renderInput={(params) => <TextField {...params} label={key} />}
                            options={["<none>", ...options]} sx={{ maxWidth: 300 }}
                            onChange={(event, value:string|null) => {
                                props.filterChangeCallback(key, value)
                            }}
                        />
                    )
                })}
            </Stack>
        )
}