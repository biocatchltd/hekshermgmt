import * as React from 'react';
import { Stack, StackProps, TextField } from '@mui/material';
import { AutocompleteWithDefault } from './autocompleteWithDefault';

type ContextSelectProps = {
    context_options: Map<string, Set<string>>;
    filterChangeCallback: (key: string, value: string | null) => void;
    initialValue?: Map<string, string>;
    stackProps?: StackProps;
    isConcrete?: boolean;
};

/**
 * a component that allows selection of a context.
 * This component has 2 modes: concrete, where the selected context must be applicable to a rule.
 * And non-concrete, where the selected context is just a filter.
 */
export function ContextSelect(props: ContextSelectProps) {
    const { isConcrete = false } = props;
    return (
        <Stack {...props.stackProps}>
            {Array.from(props.context_options.entries()).map(([key, values]) => {
                const options = Array.from(values);
                options.sort();

                return (
                    <AutocompleteWithDefault
                        key={key + '@' + props.initialValue?.get(key)}
                        autoCompleteProps={{
                            style: { flexDirection: 'row', width: '100%', flex: 1 },
                            renderInput: (params) => <TextField {...params} label={key} />,
                            options: isConcrete ? ['*', ...options] : ['<none>', ...options],
                            sx: { maxWidth: 300 },
                            freeSolo: isConcrete,
                            onInputChange: (event, value: string | null) => props.filterChangeCallback(key, value),
                            value: props.initialValue?.get(key),
                        }}
                        default_value={isConcrete ? '*' : ''}
                    />
                );
            })}
        </Stack>
    );
}
