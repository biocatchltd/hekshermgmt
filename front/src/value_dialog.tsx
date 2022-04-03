import { ReactNode, useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    PaperProps,
    TextField,
} from '@mui/material';
import Draggable from 'react-draggable';
import * as React from 'react';
import { ContextSelect } from './context_select';
import { getRule, RuleBranch } from './potential_rules';

type ValueViewDialogProps = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    title: string;
};

function PaperComponent(props: PaperProps) {
    return (
        <Draggable handle='#draggable-dialog-title'>
            {/* todo an issue right now is that nested dialogs all drag together, I don't care about this right now*/}
            <Paper {...props} />
        </Draggable>
    );
}

export function ValueViewDialog(props: ValueViewDialogProps) {
    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            PaperComponent={PaperComponent}
            aria-labelledby='draggable-dialog-title'
            transitionDuration={{ exit: 0 }}
        >
            <DialogTitle style={{ cursor: 'move' }} id='draggable-dialog-title'>
                {props.title}
            </DialogTitle>
            <DialogContent>
                <div>{props.children}</div>
            </DialogContent>
        </Dialog>
    );
}

type ValueEditDialogNoContextProps = {
    open: boolean;
    onClose: (ok: boolean) => void;
    initial_value: any;
    on_value_changed: (new_value: any) => void;
    on_validity_changed: (new_err: string) => void;
    children_factory: (
        value: any,
        on_change_value: (new_value: any) => void,
        on_change_validity: (err: string) => void,
    ) => ReactNode;
    title: string;
};

type ValueEditDialogConstContextProps = {
    open: boolean;
    onClose: (ok: boolean) => void;
    initial_value: any;
    on_value_changed: (new_value: any) => void;
    on_validity_changed: (new_err: string) => void;
    children_factory: (
        value: any,
        on_change_value: (new_value: any) => void,
        on_change_validity: (err: string) => void,
    ) => ReactNode;
    title: string;

    initialContext: Map<string, string>;
    existingRuleBranch: RuleBranch;
    contextFeatures: string[];
};

type ValueEditDialogNewContextProps = {
    open: boolean;
    onClose: (ok: boolean) => void;
    initial_value: any;
    on_value_changed: (new_value: any) => void;
    on_validity_changed: (new_err: string) => void;
    children_factory: (
        value: any,
        on_change_value: (new_value: any) => void,
        on_change_validity: (err: string) => void,
    ) => ReactNode;
    title: string;
    initialContext: Map<string, string>;
    contextOptions: Map<string, Set<string>>;
    onContextChanged: (contexts: Map<string, string>) => void;
    existingRuleBranch: RuleBranch;
    contextFeatures: string[];
    onInfoChange: (info: string) => void;
};

// todo common supercomp?
export function ValueEditDialogNewContext(props: ValueEditDialogNewContextProps) {
    const [valueError, setValueError] = useState('');
    const [value, setValue] = useState(props.initial_value);
    const [contextError, setContextError] = useState('');
    const [context, setContext] = useState(props.initialContext);

    // all contexts that are "undefined" in the partial context should default to *
    const initial_context = new Map(
        Array.from(props.contextOptions!.keys()).map((k) => {
            let v = props.initialContext!.get(k);
            if (v === undefined || v === '<none>') {
                v = '*';
            }
            return [k, v];
        }),
    );
    useEffect(() => {
        const user_context = new Map(Array.from(context.entries()).filter(([, v]) => v !== '*'));
        props.onContextChanged!(user_context);
        for (const [k, v] of context.entries()) {
            if (v === '') {
                setContextError(`context ${k} cannot be empty`);
                return;
            }
        }
        const existingRule = getRule(props.existingRuleBranch!, context, props.contextFeatures!);
        if (existingRule !== null) {
            if (existingRule.rule_id === -1) {
                // default rule
                setContextError('Rule must have at least one condition');
            } else {
                setContextError(`Rule already exists with ID ${existingRule.rule_id}`);
            }
        } else {
            setContextError('');
        }
    }, [context]);
    const changeContext = (k: string, v: string | null) => {
        const newContext = new Map(context);
        newContext.set(k, v ?? '');
        setContext(newContext);
    };

    useEffect(() => {
        props.on_value_changed(value);
    }, [value]);

    useEffect(() => {
        props.on_validity_changed(valueError || contextError);
    }, [valueError, contextError]);

    return (
        <Dialog
            open={props.open}
            PaperComponent={PaperComponent}
            aria-labelledby='draggable-dialog-title'
            transitionDuration={{ exit: 0 }}
        >
            <DialogTitle style={{ cursor: 'move' }} id='draggable-dialog-title'>
                {props.title}
            </DialogTitle>
            {contextError && <Alert severity='error'>{contextError}</Alert>}
            {valueError && <Alert severity='error'>{valueError}</Alert>}
            <div style={{ justifyContent: 'center', width: '100%' }}>
                <ContextSelect
                    context_options={props.contextOptions!}
                    filterChangeCallback={changeContext}
                    initialValue={initial_context}
                    isConcrete={true}
                    stackProps={{ spacing: 1, alignItems: 'center' }}
                />
            </div>
            <DialogContent>
                <div>
                    {props.children_factory(
                        value,
                        (v) => setValue(v),
                        (e) => setValueError(e),
                    )}
                </div>
                <TextField onChange={(e) => props.onInfoChange(e.target.value)} sx={{ py: 1 }} label='Info' />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => props.onClose(true)} disabled={valueError !== '' || contextError !== ''}>
                    OK
                </Button>
                <Button onClick={() => props.onClose(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}

export function ValueEditDialogConstContext(props: ValueEditDialogConstContextProps) {
    const [valueError, setValueError] = useState('');
    const [value, setValue] = useState(props.initial_value);
    // all contexts that are "undefined" in the partial context should default to *
    const initial_context = new Map(
        Array.from(props.contextFeatures).map((k) => {
            let v = props.initialContext!.get(k);
            if (v === undefined || v === '<none>') {
                v = '*';
            }
            return [k, v];
        }),
    );

    useEffect(() => {
        props.on_value_changed(value);
    }, [value]);

    useEffect(() => {
        props.on_validity_changed(valueError);
    }, [valueError]);

    return (
        <Dialog
            open={props.open}
            PaperComponent={PaperComponent}
            aria-labelledby='draggable-dialog-title'
            transitionDuration={{ exit: 0 }}
        >
            <DialogTitle style={{ cursor: 'move' }} id='draggable-dialog-title'>
                {props.title}
                <div style={{ fontStyle: 'small' }}>
                    {Array.from(initial_context.entries())
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                </div>
            </DialogTitle>
            {valueError && <Alert severity='error'>{valueError}</Alert>}
            <DialogContent>
                <div>
                    {props.children_factory(
                        value,
                        (v) => setValue(v),
                        (e) => setValueError(e),
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => props.onClose(true)} disabled={valueError !== ''}>
                    OK
                </Button>
                <Button onClick={() => props.onClose(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}

export function ValueEditDialogNoContext(props: ValueEditDialogNoContextProps) {
    const [valueError, setValueError] = useState('');
    const [value, setValue] = useState(props.initial_value);

    useEffect(() => {
        props.on_value_changed(value);
    }, [value]);

    useEffect(() => {
        props.on_validity_changed(valueError);
    }, [valueError]);

    return (
        <Dialog
            open={props.open}
            PaperComponent={PaperComponent}
            aria-labelledby='draggable-dialog-title'
            transitionDuration={{ exit: 0 }}
        >
            <DialogTitle style={{ cursor: 'move' }} id='draggable-dialog-title'>
                {props.title}
            </DialogTitle>
            {valueError && <Alert severity='error'>{valueError}</Alert>}
            <DialogContent>
                <div>
                    {props.children_factory(
                        value,
                        (v) => setValue(v),
                        (e) => setValueError(e),
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => props.onClose(true)} disabled={valueError !== ''}>
                    OK
                </Button>
                <Button onClick={() => props.onClose(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
