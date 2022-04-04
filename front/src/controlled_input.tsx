import {
    TextFieldProps,
    TextField,
    List,
    Switch,
    SwitchProps,
    RadioGroup,
    FormControlLabel,
    Radio,
    ListItem,
    ListItemIcon,
    ListItemText,
    Card,
    CardHeader,
    Divider,
    Grid,
    Button,
} from '@mui/material';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import { useEffect, useState } from 'react';
import { primitive_to_str } from './setting_type';
import * as React from 'react';
import useDeepEffect from '@lucarestagno/use-deep-effect';

type ControlledTextFieldProps = {
    initialValue: string;
    textFieldProps: TextFieldProps;
    onChange: (s: string) => void;
    onValidityChange?: (err: string) => void;
    errorMsg?: (s: string) => string | null;
};

export function ControlledTextField(props: ControlledTextFieldProps) {
    const [value, setValue] = useState<string>(props.initialValue);
    const [errorText, setErrorText] = useState('');

    useEffect(() => {
        setValue(props.initialValue);
    }, [props.initialValue]);

    if (props.errorMsg !== undefined) {
        useEffect(() => {
            const msg = props.errorMsg?.(value);
            setErrorText(msg ?? '');
        }, [value]);
        if (props.onValidityChange !== undefined) {
            useEffect(() => {
                props.onValidityChange?.(errorText);
            }, [errorText]);
        }
    }

    return (
        <TextField
            {...props.textFieldProps}
            value={value}
            onChange={(e) => {
                props.onChange(e.target.value);
                setValue(e.target.value);
            }}
            error={errorText != ''}
            helperText={errorText}
            fullWidth
        />
    );
}

type ControlledSwitchProps = {
    initialValue: boolean;
    switchProps?: SwitchProps;
    onChange: (b: boolean) => void;
};

export function ControlledSwitch(props: ControlledSwitchProps) {
    const [value, setValue] = useState<boolean>(props.initialValue);

    useEffect(() => {
        setValue(props.initialValue);
    }, [props.initialValue]);

    return (
        <Switch
            {...props.switchProps}
            checked={value}
            onChange={(e, b) => {
                props.onChange(b);
                setValue(b);
            }}
        />
    );
}

type ControlledRadioGroupProps = {
    options: any[];
    optionLabels: string[];
    initialValue: any;
    onChange: (v: any) => void;
};

export function ControlledRadioGroup(props: ControlledRadioGroupProps) {
    const [value, setValue] = useState(props.initialValue);

    useEffect(() => {
        setValue(props.initialValue);
    }, [props.initialValue]);

    return (
        <RadioGroup
            value={value}
            onChange={(e) => {
                props.onChange(e.target.value);
                setValue(e.target.value);
            }}
        >
            {props.options.map((v, i) => (
                <FormControlLabel control={<Radio />} label={props.optionLabels[i]} value={v} key={i} />
            ))}
        </RadioGroup>
    );
}

type ControlledTransferListProps = {
    initialIncluded: Set<any>;
    initialExcluded: Set<any>;
    onChange: (v: any[]) => void;
};

export function ControlledTransferList(props: ControlledTransferListProps) {
    const [included, setIncluded] = useState(props.initialIncluded);
    const [excluded, setExcluded] = useState(props.initialExcluded);

    useDeepEffect(() => {
        setIncluded(props.initialIncluded);
        setExcluded(props.initialExcluded);
    }, [props.initialIncluded, props.initialExcluded]);

    const transfer = (value: number) => () => {
        const newIncluded = new Set(included);
        const newExcluded = new Set(excluded);

        if (newIncluded.delete(value)) {
            newExcluded.add(value);
        } else {
            newExcluded.delete(value);
            newIncluded.add(value);
        }

        setIncluded(newIncluded);
        setExcluded(newExcluded);
        props.onChange(Array.from(newIncluded));
    };

    const includeAll = () => {
        const newIncluded = new Set([...included, ...excluded]);
        setIncluded(newIncluded);
        setExcluded(new Set());
        props.onChange(Array.from(newIncluded));
    };
    const excludeAll = () => {
        setIncluded(new Set());
        setExcluded(new Set([...included, ...excluded]));
        props.onChange([]);
    };

    const customList = (title: string, items: Set<any>, is_left: boolean) => {
        const ordered_items = Array.from(items);
        ordered_items.sort((a, b) => primitive_to_str(a).localeCompare(primitive_to_str(b)));
        return (
            <Card>
                <CardHeader sx={{ px: 2, py: 1 }} title={title} />
                <Divider />
                <List dense component='div' role='list'>
                    {ordered_items.map((value: any) => {
                        const labelId = `transfer-list-item-${value}-label`;

                        return (
                            <ListItem key={value} role='listitem' button onClick={transfer(value)}>
                                <ListItemIcon>
                                    {is_left ? <ArrowCircleRightIcon /> : <ArrowCircleLeftIcon />}
                                </ListItemIcon>
                                <ListItemText id={labelId} primary={primitive_to_str(value)} />
                            </ListItem>
                        );
                    })}
                    <ListItem />
                </List>
            </Card>
        );
    };

    return (
        <Grid container spacing={2} justifyContent='center' alignItems='center'>
            <Grid item>{customList('Included', included, true)}</Grid>
            <Grid item>
                <Grid container direction='column' alignItems='center'>
                    <Button
                        sx={{ my: 0.5 }}
                        variant='outlined'
                        size='small'
                        onClick={excludeAll}
                        disabled={included.size === 0}
                        aria-label='exclude all'
                    >
                        ≫
                    </Button>
                    <Button
                        sx={{ my: 0.5 }}
                        variant='outlined'
                        size='small'
                        onClick={includeAll}
                        disabled={excluded.size === 0}
                        aria-label='include all'
                    >
                        ≪
                    </Button>
                </Grid>
            </Grid>
            <Grid item>{customList('Excluded', excluded, false)}</Grid>
        </Grid>
    );
}
