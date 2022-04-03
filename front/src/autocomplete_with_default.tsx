import { Autocomplete, AutocompleteInputChangeReason, AutocompleteProps } from '@mui/material';
import { SyntheticEvent, useState } from 'react';
import * as React from 'react';

type AutocompleteWithDefaultProps = {
    props: AutocompleteProps<any, any, any, any>;
    default: string;
};

/**
 * a managed autocomplete component that defaults to a non-blank value when cleared
 */
export function AutocompleteWithDefault(props: AutocompleteWithDefaultProps) {
    const [value, setValue] = useState(props.props.value ?? '');
    const [inputValue, setInputValue] = useState(value);

    const handleInputValueChange = (
        event: SyntheticEvent,
        new_value: string,
        reason: AutocompleteInputChangeReason,
    ) => {
        if (reason === 'clear') {
            new_value = props.default;
        }
        setInputValue(new_value);
        if (props.props.onInputChange !== undefined) {
            props.props.onInputChange(event, new_value, reason);
        }
    };

    return (
        <Autocomplete
            {...props.props}
            freeSolo
            value={value}
            inputValue={inputValue}
            onInputChange={handleInputValueChange}
            onChange={(e, v, r) => {
                if (r === 'clear') {
                    v = props.default;
                }
                setValue(v);
                if (props.props.onChange !== undefined) {
                    props.props.onChange(e, v, r);
                }
            }}
        />
    );
}
