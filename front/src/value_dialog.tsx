import {ReactNode, useEffect, useState} from "react";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, PaperProps} from "@mui/material";
import Draggable from "react-draggable";
import * as React from "react";
import {ContextSelect} from "./context_select";
import {RuleSet} from "./index";
import {getRule, RuleBranch} from "./potential_rules";

type ValueViewDialogProps = {
    open: boolean;
    onClose: () => void,
    children: ReactNode;
    title: string;
}

function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
        >
            {/* todo an issue right now is that nested dialogs all drag together, I don't care about this right now*/}
            <Paper {...props} />
        </Draggable>
    );
}

export function ValueViewDialog(props: ValueViewDialogProps) {
    return <Dialog open={props.open}
                   onClose={
                       props.onClose
                   }
                   PaperComponent={PaperComponent}
                   aria-labelledby="draggable-dialog-title"
                   transitionDuration={{'exit': 0}}
    >
        <DialogTitle style={{cursor: 'move'}} id="draggable-dialog-title">
            {props.title}
        </DialogTitle>
        <DialogContent>
            <div>
                {props.children}
            </div>
        </DialogContent>
    </Dialog>;
}

type ValueEditDialogProps = {
    open: boolean;
    onClose: (ok: boolean) => void;
    initial_value: any;
    on_value_changed: (new_value: any) => void;
    on_validity_changed: (new_err: string) => void;
    children_factory: (value: any, on_change_value: (new_value: any) => void, on_change_validity: (err: string) => void) => ReactNode;
    title: string;
    initialContext?: Map<string, string>
    contextOptions?: Map<string, Set<string>>
    onContextChanged?: (contexts: Map<string, string>) => void
    existingRuleBranch?: RuleBranch
    contextFeatures?: string[]
}

export function ValueEditDialog(props: ValueEditDialogProps) {
    const [valueError, setValueError] = useState("");
    const [value, setValue] = useState(props.initial_value);
    // there are 3 possible situations: either the context exists and is fully editable (so we show a context select), or
    // the context is locked (so we show a subtitle), or the context is missing (we show nothing)
    let context_label = null;
    let context_select = null;
    if (props.initialContext !== undefined) {
        // all contexts that are "undefined in the partial context should default to *
        let initial_context = new Map(Array.from(props.contextOptions!.keys()).map(
            (k) => {
                let v = props.initialContext!.get(k);
                if (v === undefined || v === "<none>") {
                    v = "*"
                }
                return [k, v]
            }
        ))
        if (props.onContextChanged !== undefined) {
            const [context, setContext] = useState(props.initialContext);
            const [contextError, setContextError] = useState("");
            useEffect(() => {
                props.onContextChanged!(context);
                for (let [k, v] of context.entries()) {
                    if (v === "") {
                        setContextError(`context ${k} cannot be empty`)
                        return
                    }
                }
                let existingRule = getRule(props.existingRuleBranch!, context, props.contextFeatures!);
                if (existingRule !== null) {
                    if (existingRule.rule_id === -1) {  // default rule
                        setContextError("Rule must have at least one condition")
                    } else {
                        setContextError(`Rule already exists with ID ${existingRule.rule_id}`)
                    }
                }
            }, [context])
            let changeContext = (k: string, v: string | null) => {
                let newContext = new Map(context);
                newContext.set(k, v ?? "");
                setContext(newContext)
            }
            context_select = <ContextSelect context_options={props.contextOptions!} filterChangeCallback={changeContext}
                                            initialValue={initial_context} isConcrete={true}
                                            stackProps={{spacing: 1, alignItems: "center"}}/>
        } else {
            const contextError = "";
            context_label =
                <div style={{fontStyle: 'small'}}>{Array.from(props.initialContext!.entries()).map(([key, value]) => {
                    `${key}: ${value}`
                }).join(", ")}</div>
        }
    } else{
        const contextError = "";
    }

    useEffect(() => {
        props.on_value_changed(value);
    }, [value])

    useEffect(() => {
        props.on_validity_changed(valueError || contextError);
    }, [valueError, contextError])

    return <Dialog open={props.open}
                   PaperComponent={PaperComponent}
                   aria-labelledby="draggable-dialog-title"
                   transitionDuration={{'exit': 0}}
    >
        <DialogTitle style={{cursor: 'move'}} id="draggable-dialog-title">
            {props.title}
            {context_label}
        </DialogTitle>
        {error && <Alert severity="error">{error}</Alert>}
        <div style={{justifyContent: "center", width: "100%"}}>
            {context_select}
        </div>
        <DialogContent>
            <div>
                {props.children_factory(value, (v) => setValue(v), (e) => setValueError(e))}
            </div>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => props.onClose(true)} disabled={valueError !== "" || contextError !== ""}>
                OK
            </Button>
            <Button onClick={() => props.onClose(false)}>
                Cancel
            </Button>
        </DialogActions>
    </Dialog>;
}