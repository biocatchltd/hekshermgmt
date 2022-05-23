import { Autocomplete, AutocompleteInputChangeReason, AutocompleteProps } from '@mui/material';
import { SyntheticEvent, useState } from 'react';
import * as React from 'react';

type AutocompleteWithDefaultProps = {
    autoCompleteProps: AutocompleteProps<any, any, any, any>;
    default_value: string;
};

/**
 * a managed autocomplete component that defaults to a non-blank value when cleared
 */
export function AutocompleteWithDefault({ autoCompleteProps, default_value }: AutocompleteWithDefaultProps) {
    const [value, setValue] = useState(autoCompleteProps.value ?? '');
    const [inputValue, setInputValue] = useState(value);

    const handleInputValueChange = (
        event: SyntheticEvent,
        new_value: string,
        reason: AutocompleteInputChangeReason,
    ) => {
        if (reason === 'clear') {
            new_value = default_value;
        }
        setInputValue(new_value);
        if (autoCompleteProps.onInputChange !== undefined) {
            autoCompleteProps.onInputChange(event, new_value, reason);
        }
    };

    return (
        <Autocomplete
            {...autoCompleteProps}
            freeSolo
            value={value}
            inputValue={inputValue}
            onInputChange={handleInputValueChange}
            onChange={(e, v, r) => {
                if (r === 'clear') {
                    v = default_value;
                }
                setValue(v);
                if (autoCompleteProps.onChange !== undefined) {
                    autoCompleteProps.onChange(e, v, r);
                }
            }}
        />
    );
}
