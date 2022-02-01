import {Autocomplete, AutocompleteInputChangeReason, AutocompleteProps} from "@mui/material";
import {SyntheticEvent, useState} from "react";

type AutocompleteWithDefaultProps = {
    props: AutocompleteProps<any, any, any, any>,
    default: string
}

export function AutocompleteWithDefault(props: AutocompleteWithDefaultProps) {
    let [value, setValue] = useState(props.props.value ?? "")
    let [inputValue, setInputValue] = useState(value)

    const handleInputValueChange = (event: SyntheticEvent, value: string, reason: AutocompleteInputChangeReason) => {
        if (reason === 'clear') {
            value = props.default;
        }
        setInputValue(value);
        if (props.props.onInputChange !== undefined) {
            props.props.onInputChange(event, value, reason);
        }
    }

    return <Autocomplete {...props.props} freeSolo value={value} inputValue={inputValue} onInputChange={handleInputValueChange} onChange={(e, v,r) => {
        if (r === 'clear') {
            v = props.default;
        }
        setValue(v);
        if (props.props.onChange !== undefined){
            props.props.onChange(e,v,r)
        }
    }}/>
}