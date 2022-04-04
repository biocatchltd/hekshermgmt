import { ReactNode, useEffect, useMemo, useState } from 'react';
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
    IconButton,
    Tooltip,
} from '@mui/material';
import Draggable from 'react-draggable';
import * as React from 'react';
import { ContextSelect } from './context_select';
import { getRule, RuleBranch } from './potential_rules';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { useSnackbar } from 'notistack';
import { ConfirmDialog } from './confirm_dialog';

type ValueViewDialogProps = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    title: string;
    export: string;
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
    const { enqueueSnackbar } = useSnackbar();

    const copyContent = () => {
        navigator.clipboard.writeText(props.export);
        enqueueSnackbar('Copied to clipboard', { variant: 'info' });
    };

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
            <DialogActions>
                <Tooltip title='copy raw value'>
                    <IconButton onClick={copyContent} color='primary'>
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
            </DialogActions>
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
    isValidValue: (value: any) => boolean;
};

/*
we have three different dialogs here:
1. changeable context, for new rules
2. constant context, for existing rules
3. no context, for specific elements of values
 */

// todo common supercomp?
export function ValueEditDialogNewContext(props: ValueEditDialogNewContextProps) {
    const [valueError, setValueError] = useState('');
    const [value, setValue] = useState(props.initial_value);
    const [contextError, setContextError] = useState('');
    const [context, setContext] = useState(props.initialContext);

    const [importValue, setImportValue] = useState<any>(null);
    const [importError, setImportError] = useState('enter a json string to import');
    const [importOpen, setImportOpen] = useState(false);

    const { enqueueSnackbar } = useSnackbar();

    const copyContent = () => {
        navigator.clipboard.writeText(JSON.stringify(value));
        enqueueSnackbar('Copied to clipboard', { variant: 'info' });
    };

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
                <TextField onChange={(e) => props.onInfoChange(e.target.value)} sx={{ py: 1 }} label='Info' fullWidth />
            </DialogContent>
            <DialogActions>
                <Tooltip title='import raw value'>
                    <IconButton onClick={() => setImportOpen(true)} color='primary'>
                        <TextSnippetIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title='copy raw value'>
                    <IconButton onClick={copyContent} color='primary' disabled={valueError !== ''}>
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
                <Button onClick={() => props.onClose(true)} disabled={valueError !== '' || contextError !== ''}>
                    OK
                </Button>
                <Button onClick={() => props.onClose(false)}>Cancel</Button>
            </DialogActions>
            {importOpen && (
                <ConfirmDialog
                    title='import raw value'
                    handleClose={() => setImportOpen(false)}
                    handleConfirm={() => setValue(importValue)}
                    allowConfirm={importError === ''}
                >
                    <TextField
                        onChange={(event) => {
                            let imported_value;
                            try {
                                imported_value = JSON.parse(event.target.value);
                            } catch (e) {
                                setImportError(e.message);
                                return;
                            }
                            if (!props.isValidValue(imported_value)) {
                                setImportError('invalid value');
                                return;
                            }
                            setImportError('');
                            setImportValue(imported_value);
                        }}
                        multiline
                        error={importError !== ''}
                        helperText={importError}
                    />
                </ConfirmDialog>
            )}
        </Dialog>
    );
}

export function ValueEditDialogConstContext(props: ValueEditDialogConstContextProps) {
    const [valueError, setValueError] = useState('');
    const [value, setValue] = useState(props.initial_value);

    const { enqueueSnackbar } = useSnackbar();

    const copyContent = () => {
        navigator.clipboard.writeText(JSON.stringify(value));
        enqueueSnackbar('Copied to clipboard', { variant: 'info' });
    };

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
                <Tooltip title='copy raw value'>
                    <IconButton onClick={copyContent} color='primary' disabled={valueError !== ''}>
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
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

    const { enqueueSnackbar } = useSnackbar();

    const copyContent = () => {
        navigator.clipboard.writeText(JSON.stringify(value));
        enqueueSnackbar('Copied to clipboard', { variant: 'info' });
    };

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
                <Tooltip title='copy raw value'>
                    <IconButton onClick={copyContent} color='primary' disabled={valueError !== ''}>
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
                <Button onClick={() => props.onClose(true)} disabled={valueError !== ''}>
                    OK
                </Button>
                <Button onClick={() => props.onClose(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
