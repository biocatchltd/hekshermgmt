import {
    Collapse, Divider, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Stack
} from "@mui/material";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import ExtensionIcon from '@mui/icons-material/Extension';
import ExtensionOffIcon from '@mui/icons-material/ExtensionOff';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import * as React from "react";
import {useEffect, useState} from "react";
import {ValueViewDialog} from "./value_dialog";
import {ControlledRadioGroup, ControlledSwitch, ControlledTextField, ControlledTransferList} from "./controlled_input";
import AddIcon from '@mui/icons-material/Add';
import {TransitionGroup} from "react-transition-group";
import {v4 as uuid} from 'uuid'

export interface SettingType<T> {
    toString(): string;

    Format(value: T): string;

    asData(value: T): string | number | (string | number)[];

    asViewElement(value: T): JSX.Element;

    asEditElement(value: T, onChange: (new_value: T) => void, onValidChange: (newError: string | null) => void): JSX.Element;

    editElementShort(): boolean;

    defaultValue(): T;
}

class StrSettingType implements SettingType<string> {
    toString(): string {
        return "str";
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string {
        return value;
    }

    asViewElement(value: string): JSX.Element {
        return <Typography color="text.primary">{value}</Typography>;
    }

    asEditElement(value: string, onChange: (new_value: string) => void, onValidChange: (newError: string | null) => void): JSX.Element {
        return <ControlledTextField textFieldProps={{multiline: true}} initialValue={value} onChange={onChange}/>;
    }

    editElementShort(): boolean {
        return true
    }

    defaultValue(): string {
        return ""
    }
}

class IntSettingType implements SettingType<number> {
    toString(): string {
        return "int";
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string | number {
        return value;
    }

    asViewElement(value: number): JSX.Element {
        return <Typography color="text.primary">{value}</Typography>;
    }

    asEditElement(value: number, onChange: (new_value: number) => void, onValidChange: (newError: string | null) => void): JSX.Element {
        return <ControlledTextField textFieldProps={{multiline: true,}}
                                    initialValue={value.toString()}
                                    onChange={s => onChange(parseInt(s))}
                                    errorMsg={s => s.match(/^([+\-])?[0-9]*$/) ? null :
                                        "value must be a whole number"}
                                    onValidityChange={onValidChange}/>;
    }

    editElementShort(): boolean {
        return true
    }

    defaultValue(): number {
        return 0
    }
}

class BoolSettingType implements SettingType<boolean> {
    toString(): string {
        return "bool";
    }

    Format(value: any): string {
        return value ? "True" : "False";
    }

    asData(value: any): string {
        return this.Format(value);
    }

    asViewElement(value: boolean): JSX.Element {
        return <Typography color="text.primary">{value ? "True" : "False"}</Typography>;
    }

    asEditElement(value: boolean, onChange: (new_value: boolean) => void, onValidChange: (newError: string | null) => void): JSX.Element {
        return <ControlledSwitch initialValue={value} onChange={onChange}/>
    }

    editElementShort(): boolean {
        return true
    }

    defaultValue(): boolean {
        return false
    }
}

class FloatSettingType implements SettingType<number> {
    toString(): string {
        return "float";
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string | number {
        return value;
    }

    asViewElement(value: number): JSX.Element {
        return <Typography color="text.primary">{value}</Typography>;
    }

    asEditElement(value: number, onChange: (new_value: number) => void, onValidChange: (newError: string | null) => void): JSX.Element {
        return <ControlledTextField textFieldProps={{multiline: true,}}
                                    initialValue={value.toString()}
                                    onChange={s => onChange(parseFloat(s))}
                                    errorMsg={s => s.match(/^([+\-])?[0-9]+(\.[0-9]+)?$/) ? null :
                                        "value must be a number"}
                                    onValidityChange={onValidChange}/>;
    }

    editElementShort(): boolean {
        return true
    }

    defaultValue(): number {
        return 0
    }
}

export function primitive_to_str(value: string | number | boolean): string {
    return value === true ? "True" : value === false ? "False" : value.toString()
}

class EnumSettingType implements SettingType<number | boolean | string> {
    values: (string | number | boolean)[]

    constructor(values: (string | number | boolean)[]) {
        this.values = values;
    }

    toString(): string {
        let parts = this.values.map((v) => JSON.stringify(v));
        parts.sort();
        return "Enum[" + parts.join(", ") + "]";
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string | number {
        if (value instanceof Boolean) {
            return value ? "True" : "False";
        }
        return value;
    }

    asViewElement(value: number | boolean | string): JSX.Element {
        const valueView = primitive_to_str(value);
        return <Typography color="text.primary">{valueView}</Typography>;
    }

    asEditElement(value: number | boolean | string, onChange: (new_value: (number | boolean | string)) => void, onValidChange: (newError: string | null) => void): JSX.Element {
        return <ControlledRadioGroup options={this.values} optionLabels={this.values.map(primitive_to_str)}
                                     initialValue={value} onChange={onChange}/>
    }

    editElementShort(): boolean {
        return false
    }

    defaultValue(): number | boolean | string {
        return this.values[0]
    }
}

type FlagsViewProps = {
    included: (string | number | boolean)[];
    excluded: (string | number | boolean)[];
}

function FlagsView(props: FlagsViewProps) {
    const [includedOpen, setIncludedOpen] = useState(true);
    const [excludedOpen, setExcludedOpen] = useState(false);

    return <List>
        <ListItem onClick={() => setIncludedOpen(!includedOpen)}>
            <ListItemText primary="Included"/>
            {includedOpen ? <ExpandLess/> : <ExpandMore/>}
        </ListItem>
        <Collapse in={includedOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
                {props.included.map((v, i) => <ListItem key={i}>
                    <ListItemIcon><ExtensionIcon/></ListItemIcon>
                    <ListItemText primary={v}/>
                </ListItem>)}
            </List>
        </Collapse>

        <ListItem onClick={() => setExcludedOpen(!excludedOpen)}>
            <ListItemText secondary="Excluded"/>
            {excludedOpen ? <ExpandLess/> : <ExpandMore/>}
        </ListItem>
        <Collapse in={excludedOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
                {props.excluded.map((v, i) => <ListItem key={i}>
                    <ListItemIcon><ExtensionOffIcon/></ListItemIcon>
                    <ListItemText secondary={v}/>
                </ListItem>)}
            </List>
        </Collapse>
    </List>
}


class FlagsSettingType implements SettingType<(number | boolean | string)[]> {
    values: (string | number | boolean)[]

    constructor(values: (string | number | boolean)[]) {
        this.values = values;
    }

    toString(): string {
        let parts = this.values.map((v) => JSON.stringify(v));
        parts.sort();
        return "Flags[" + parts.join(", ") + "]";
    }

    Format(value: any): string {
        let parts = value.map((v: any) => JSON.stringify(v));
        parts.sort();
        return "[" + parts.join(", ") + "]";
    }

    asViewElement(value: any[]): JSX.Element {
        value = value.slice()
        value.sort();
        let excluded = this.values.filter((v) => !value.includes(v));  // todo improve
        excluded.sort();
        return <FlagsView included={value} excluded={excluded}/>
    }

    asData(value: any): (string | number)[] {
        return value.map((v: any) => JSON.stringify(v));
    }

    asEditElement(value: (number | boolean | string)[], onChange: (new_value: (number | boolean | string)[]) => void, onValidChange: (newError: string | null) => void): JSX.Element {
        let included = new Set(value);
        let excluded = new Set(this.values.filter(a => !included.has(a)))
        return <ControlledTransferList initialExcluded={excluded} initialIncluded={included} onChange={onChange}/>
    }

    editElementShort(): boolean {
        return false
    }

    defaultValue(): (number | boolean | string)[] {
        return []
    }
}


type SequenceViewProps = {
    elementType: SettingType<any>;
    values: any[];
}


function SequenceView(props: SequenceViewProps) {
    const [dialogTarget, setDialogTarget] = useState<{ index: number, element: JSX.Element } | null>(null);

    return <>
        <List>
            {props.values.map((v, i) => {
                return <ListItem key={i.toString()}>
                    <ListItemButton onClick={() => setDialogTarget(
                        {element: props.elementType.asViewElement(v), index: i})}
                    >
                        <ListItemText primary={props.elementType.Format(v)}/>
                    </ListItemButton>
                </ListItem>
            })}
        </List>
        <ValueViewDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                         title={`index # ${dialogTarget?.index}`}>
            {dialogTarget?.element}
        </ValueViewDialog>
    </>
}

type BaseSequenceEditProps = {
    elementFactory: (v: any, i: number, cb: ((v: any) => void), vcb: ((v: any) => void)) => JSX.Element
    initialValue: any[]
    elementType: SettingType<any>
    onChange: (v: any[]) => void
    onValidityChange: (err: string) => void
}

function BaseSequenceEdit(props: BaseSequenceEditProps) {
    // each item is a tuple of a value, const key, and error
    const [items, setItems] = useState(props.initialValue.map((v) => [v, uuid(), ""]))

    useEffect(() => {
        props.onChange(items.map((v) => v[0]))
        let error = "";
        for (let item of items){
            if (item[2]){
                error = "index 2#: " + item[2]
                break
            }
        }
        props.onValidityChange(error)
    }, [items])

    const handleAdd = (v: any, idx: number) => () => {
        let newItems = items.slice();
        newItems.splice(idx, 0, [v, uuid(), ""]);
        setItems(newItems);
    }

    const handleAddToEnd = () => () => {
        let newItems = items.slice();
        newItems.splice(items.length, 0, [
            items.length == 0 ? props.elementType.defaultValue() : items[items.length - 1][0],
            uuid(), ""]);
        setItems(newItems);
    }

    const handleEdit = (idx: number) => (v: any) => {
        let newItems = items.slice();
        newItems[idx][0] = v;
        setItems(newItems);
    }

    const handleErrorChange = (idx: number) => (e: string) => {
        let newItems = items.slice();
        newItems[idx][2] = e;
        setItems(newItems);
    }

    const handleMoveUp = (idx: number) => () => {
        let newItems = items.slice();
        [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
        setItems(newItems);
    }

    const handleMoveDown = (idx: number) => handleMoveUp(idx + 1);

    const handleRemove = (idx: number) => () => {
        let newItems = items.slice();
        newItems.splice(idx, 1);
        setItems(newItems);
    }

    return <List>
        <TransitionGroup>
            {
                items.map((v, i) => {
                    return <Collapse key={[v[1]].toString()}>
                        <Divider textAlign="right">
                            <IconButton size="small" onClick={handleAdd(v[0], i)}>
                                <AddIcon/>
                            </IconButton>
                        </Divider>
                        <ListItem>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <div style={{'flexGrow': '1'}}>
                                    {
                                        props.elementFactory(v[0], i, handleEdit(i), handleErrorChange(i))
                                    }
                                </div>
                                <Stack spacing={0}>
                                    <IconButton size="small" disabled={i == 0} onClick={handleMoveUp(i)}
                                                sx={{my: "0px"}}>
                                        <ArrowDropUpIcon/>
                                    </IconButton>
                                    <IconButton size="small" onClick={handleRemove(i)} sx={{my: "-15px"}}>
                                        <RemoveIcon/>
                                    </IconButton>
                                    <IconButton size="small" disabled={i == items.length - 1}
                                                onClick={handleMoveDown(i)}
                                                sx={{my: "0px"}}>
                                        <ArrowDropDownIcon/>
                                    </IconButton>
                                </Stack>
                            </div>
                        </ListItem>
                    </Collapse>
                })
            }
        </TransitionGroup>
        <Divider textAlign="right" key={items.length}>
            <IconButton size="small" onClick={handleAddToEnd()}>
                <AddIcon/>
            </IconButton>
        </Divider>
    </List>
}

type SequenceEditProps = {
    initialValue: any[]
    elementType: SettingType<any>
    onChange: (v: any[]) => void
    onValidityChange: (err: string) => void
}

function LongSequenceEdit(props: SequenceEditProps) {
    const [dialogTarget, setDialogTarget] = useState<{ index: number, element: JSX.Element } | null>(null);
    return <>
        <BaseSequenceEdit elementFactory={(v, i, cb, vcb) =>
            <ListItemButton onClick={() => setDialogTarget(
                {element: props.elementType.asEditElement(v, cb, vcb), index: i})}
            >
                <ListItemText primary={props.elementType.Format(v)}/>
            </ListItemButton>
        } {...props}/>
        <ValueViewDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                         title={`index # ${dialogTarget?.index}`}>
            {dialogTarget?.element}
        </ValueViewDialog>
    </>
}

function ShortSequenceEdit(props: SequenceEditProps) {
    return <>
        <BaseSequenceEdit elementFactory={(v, i, cb, vcb) =>
            props.elementType.asEditElement(v, cb, vcb)
        } {...props}/>
    </>
}

class SequenceSettingType<E> implements SettingType<E[]> {
    elementType: SettingType<E>;

    constructor(elementType: SettingType<E>) {
        this.elementType = elementType;
    }

    toString(): string {
        return "Sequence<" + this.elementType.toString() + ">";
    }

    Format(value: E[]): string {
        return "[" + value.map((v: any) => this.elementType.Format(v)).join(", ") + "]";
    }

    asData(value: any): (string | number)[] {
        return value.map((v: any) => {
            let inner = this.elementType.asData(v)
            if (inner instanceof Array) {
                return inner.join(", ");
            }
            return inner;
        });
    }

    asViewElement(value: any[]): JSX.Element {
        return <SequenceView elementType={this.elementType} values={value}/>
    }

    asEditElement(value: E[], onChange: (new_value: E[]) => void, onValidChange: (newError: string | null) => void): JSX.Element {
        let props: SequenceEditProps = {
            initialValue: value,
            elementType: this.elementType,
            onChange: onChange,
            onValidityChange: onValidChange,
        }
        if (this.elementType.editElementShort()) {
            return <ShortSequenceEdit {...props}/>
        } else {
            return <LongSequenceEdit {...props}/>
        }
    }

    editElementShort(): boolean {
        return false
    }

    defaultValue(): E[] {
        return []
    }
}

type MappingViewProps = {
    valueType: SettingType<any>;
    entries: [key: string, value: any][];
}


function MappingView(props: MappingViewProps) {
    const [dialogTarget, setDialogTarget] = useState<{ key: string, element: JSX.Element } | null>(null);

    return <>
        <List>
            {props.entries.map(([k, v], i) => {
                return <ListItem key={i.toString()}>
                    <ListItemText primary={k + ": "}/>
                    <ListItemButton onClick={() => setDialogTarget(
                        {element: props.valueType.asViewElement(v), key: k})}
                    >
                        <ListItemText primary={props.valueType.Format(v)}/>
                    </ListItemButton>
                </ListItem>
            })}
        </List>
        <ValueViewDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                         title={`key "${dialogTarget?.key}"`}>
            {dialogTarget?.element}
        </ValueViewDialog>
    </>
}

type BaseMappingEditProps = {
    valueEditFactory: (v: any, k: string, cb: (v: any) => void, vcb: (v: string | null) => void) => JSX.Element
    initialValue: Record<string, any>
    valueType: SettingType<any>
    onChange: (v: Record<string, any>) => void
}

function BaseMappingEdit(props: BaseMappingEditProps) {
    // each entry value is a 2-tuple of a value, and a const key
    const [entries, setEntries] = useState<[string, [any, string]][]>(() => {
        let ret = Object.entries(props.initialValue).map(([k, v]) => [k, [v, uuid()]]) as [string, [any, string]][];
        ret.sort();
        return ret
    })

    useEffect(() => {
        props.onChange(Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, v[0]])))
    }, [entries])

    const handleEditKey = (idx: number) => (newKey: string) => {
        let newEntryItems = entries.slice();
        newEntryItems[idx][0] = newKey
        newEntryItems.sort((a, b) => a[0].localeCompare(b[0]))
        setEntries(newEntryItems);
    }

    const handleEditValue = (idx: number) => (v: any) => {
        let newEntryItems = entries.slice();
        newEntryItems[idx][1][0] = v;
        setEntries(newEntryItems);
    }

    const handleAdd = () => () => {
        let newEntryItems = entries.slice();
        newEntryItems.push(["", [props.valueType.defaultValue(), uuid()]]);
        newEntryItems.sort((a, b) => a[0].localeCompare(b[0]))
        setEntries(newEntryItems);
    }

    const handleRemove = (idx: number) => () => {
        let newEntryItems = entries.slice();
        newEntryItems.splice(idx, 1);
        setEntries(newEntryItems);
    }
    return <>
        <List>
            <TransitionGroup>
                {entries.map(([key, entry], idx) => {
                    return <Collapse key={entry[1].toString()}>
                        <ListItem>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <ControlledTextField textFieldProps={{multiline: true}} initialValue={key}
                                                     onChange={handleEditKey(idx)}/>
                                <ListItemText primary={" : "}/>
                                <div style={{'flexGrow': '1'}}>
                                    {
                                        props.valueEditFactory(entry[0], key, handleEditValue(idx), () => {
                                        }) // todo!
                                    }
                                </div>
                                <IconButton size="small" onClick={handleRemove(idx)} sx={{my: "-15px"}}>
                                    <RemoveIcon/>
                                </IconButton>
                            </div>
                        </ListItem>
                    </Collapse>
                })}
            </TransitionGroup>
            <Divider textAlign="right">
                <IconButton size="small" onClick={handleAdd()}>
                    <AddIcon/>
                </IconButton>
            </Divider>
        </List>
    </>
}

type MappingEditProps = {
    initialValue: Record<string, any>
    valueType: SettingType<any>
    onChange: (v: Record<string, any>) => void
}

function LongMappingEdit(props: MappingEditProps) {
    const [dialogTarget, setDialogTarget] = useState<{ key: string, element: JSX.Element } | null>(null);
    return <>
        <BaseMappingEdit valueEditFactory={(v, k, cb, vcb) =>
            <ListItemButton onClick={() => setDialogTarget(
                {
                    element: props.valueType.asEditElement(v, cb, vcb), key: k
                })
            }
            >
                <ListItemText primary={props.valueType.Format(v)}/>
            </ListItemButton>
        } {...props}/>
        <ValueViewDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                         title={`key: ${dialogTarget?.key}`}>
            {dialogTarget?.element}
        </ValueViewDialog>
    </>
}

function ShortMappingEdit(props: MappingEditProps) {
    return <BaseMappingEdit valueEditFactory={
        (v, k, cb, vcb) => props.valueType.asEditElement(v, cb, vcb)} {...props}/>
}

class MapSettingType<V> implements SettingType<Record<string, V>> {
    valueType: SettingType<V>;

    constructor(valueType: SettingType<V>) {
        this.valueType = valueType;
    }

    toString(): string {
        return "Mapping<" + this.valueType.toString() + ">";
    }

    Format(value: Record<string, V>): string {
        return "{" + Object.entries(value).map(([k, v]) => k + ": " + this.valueType.Format(v)).join(", ") + "}";
    }

    asData(value: any): string | number {
        return this.Format(value);
    }

    asViewElement(value: any): JSX.Element {
        let entries = Object.entries(value);
        entries.sort(([k1,], [k2,]) => k1.localeCompare(k2));
        return <MappingView entries={entries} valueType={this.valueType}/>
    }

    asEditElement(value: Record<string, V>, onChange: (new_value: Record<string, V>) => void): JSX.Element {
        if (this.valueType.editElementShort()) {
            return <ShortMappingEdit initialValue={value} valueType={this.valueType} onChange={onChange}/>
        } else {
            return <LongMappingEdit initialValue={value} valueType={this.valueType} onChange={onChange}/>
        }
    }

    editElementShort(): boolean {
        return false
    }

    defaultValue(): Record<string, V> {
        return {}
    }
}

export function settingType(type: string): SettingType<any> {
    switch (type) {
        case "str":
            return new StrSettingType();
        case "int":
            return new IntSettingType();
        case "bool":
            return new BoolSettingType();
        case "float":
            return new FloatSettingType();
    }
    if (type.startsWith("Enum[")) {
        let parts = type.substring(5, type.length - 1).split(",");
        let values = parts.map((v) => JSON.parse(v));
        return new EnumSettingType(values);
    }
    if (type.startsWith("Flags[")) {
        let parts = type.substring(6, type.length - 1).split(",");
        let values = parts.map((v) => JSON.parse(v));
        return new FlagsSettingType(values);
    }
    if (type.startsWith("Sequence<")) {
        let inner = type.substring(9, type.length - 1);
        let elementType = settingType(inner);
        return new SequenceSettingType(elementType);
    }
    if (type.startsWith("Mapping<")) {
        let inner = type.substring(8, type.length - 1);
        let valueType = settingType(inner);
        return new MapSettingType(valueType);
    }
    throw new Error("Unknown setting type: " + type);
}
