import * as React from "react";
import {Autocomplete, Stack, StackProps, TextField} from "@mui/material";
import {AutocompleteWithDefault} from "./autocomplete_with_default";

type ContextSelectProps = {
    context_options: Map<string, Set<string>>
    filterChangeCallback: (key: string, value: string | null) => void
    initialValue?: Map<string, string>
    stackProps?: StackProps,
    isConcrete?: boolean
}

export function ContextSelect(props: ContextSelectProps) {
    let {isConcrete = false} = props
    return (
        <Stack {...props.stackProps}>
            {Array.from(props.context_options.entries()).map(([key, values]) => {
                let options = Array.from(values);
                options.sort();

                return (
                    <AutocompleteWithDefault key={key} props={{
                        style: {flexDirection: 'row', width: '100%', flex: 1},
                        renderInput: (params) => <TextField {...params} label={key}/>,
                        options: isConcrete ? ["*", ...options] : ["<none>", ...options],
                        sx: {maxWidth: 300},
                        freeSolo: isConcrete,
                        onInputChange: (event, value: string | null) => props.filterChangeCallback(key, value),
                        value: props.initialValue?.get(key)
                    }} default={isConcrete ? "*" : ""}/>
                )
            })}
        </Stack>
    )
}