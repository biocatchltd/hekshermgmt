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
import {ValueDialog} from "./value_dialog";
import {ControlledRadioGroup, ControlledSwitch, ControlledTextField, ControlledTransferList} from "./controlled_input";
import AddIcon from '@mui/icons-material/Add';
import {TransitionGroup} from "react-transition-group";
import {v4 as uuid} from 'uuid'

export interface SettingType<T> {
    toString(): string;

    Format(value: T): string;

    asData(value: T): string | number | (string | number)[];

    asViewElement(value: T): JSX.Element;

    asEditElement(value: T, onChange: (new_value: T) => void): JSX.Element;

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

    asEditElement(value: string, onChange: (new_value: string) => void): JSX.Element {
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

    asEditElement(value: number, onChange: (new_value: number) => void): JSX.Element {
        return <ControlledTextField textFieldProps=
                                        {{multiline: true, inputProps: {inputMode: 'numeric', pattern: '(+|-)?[0-9]*'}}}
                                    initialValue={value.toString()} onChange={s => onChange(parseInt(s))}/>;
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

    asEditElement(value: boolean, onChange: (new_value: boolean) => void): JSX.Element {
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

    asEditElement(value: number, onChange: (new_value: number) => void): JSX.Element {
        return <ControlledTextField textFieldProps=
                                        {{
                                            multiline: true,
                                            inputProps: {inputMode: 'numeric', pattern: '(+|-)?[0-9]+(\.[0-9]+)?'}
                                        }}
                                    initialValue={value.toString()} onChange={s => onChange(parseFloat(s))}/>;
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

    asEditElement(value: number | boolean | string, onChange: (new_value: (number | boolean | string)) => void): JSX.Element {
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

    asEditElement(value: (number | boolean | string)[], onChange: (new_value: (number | boolean | string)[]) => void): JSX.Element {
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
        <ValueDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                     title={`index # ${dialogTarget?.index}`}>
            {dialogTarget?.element}
        </ValueDialog>
    </>
}

type BaseSequenceEditProps ={
    element_factory: (v: any, i: number, cb: ((v: any) => void)) => JSX.Element
    initalValue: any[]
    elementType: SettingType<any>
    onChange: (v: any[]) => void
}

function BaseSequenceEdit(props: BaseSequenceEditProps){
    // each key of each item is a 3-tuple of a value, const key and version
    const [items, setItems] = useState(props.initalValue.map((v) => [v, uuid(), 0]))
    const [dialogTarget, setDialogTarget] = useState<{ index: number, element: JSX.Element } | null>(null);

    useEffect(() => {
        props.onChange(items.map((v) => v[0]))
    }, [items])

    const handleAdd = (v: any, idx: number) => () => {
        let newItems = items.slice();
        newItems.splice(idx, 0, [v, uuid(), 0]);
        setItems(newItems);
    }

    const handleEdit = (idx: number) => (v: any) => {
        let newItems = items.slice();
        newItems[idx][0] = v;
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

    return <>
        <List>
            <TransitionGroup>
                {
                    items.map((v, i) => {
                        return <Collapse key={[v[1], v[2]].toString()}>
                            <Divider textAlign="right">
                                <IconButton size="small" onClick={handleAdd(v[0], i)}>
                                    <AddIcon/>
                                </IconButton>
                            </Divider>
                            <ListItem>
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                    <div style={{'flexGrow': '1'}}>
                                        {props.element_factory(v[0],i, handleEdit(i))}
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
        </List>
        <ValueDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                     title={`index # ${dialogTarget?.index}`}>
            {dialogTarget?.element}
        </ValueDialog>
    </>
}

function LongSequenceEdit(props: SequenceEditProps) {
    // each key of each item is a 3-tuple of a value, const key and version
    const [items, setItems] = useState(props.initalValue.map((v) => [v, uuid(), 0]))
    const [dialogTarget, setDialogTarget] = useState<{ index: number, element: JSX.Element } | null>(null);

    useEffect(() => {
        props.onChange(items.map((v) => v[0]))
    }, [items])

    const handleAdd = (v: any, idx: number) => () => {
        let newItems = items.slice();
        newItems.splice(idx, 0, [v, uuid(), 0]);
        setItems(newItems);
    }

    const handleEdit = (idx: number) => (v: any) => {
        let newItems = items.slice();
        newItems[idx][0] = v;
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

    return <>
        <List>
            <TransitionGroup>
                {
                    items.map((v, i) => {
                        return <Collapse key={[v[1], v[2]].toString()}>
                            <Divider textAlign="right">
                                <IconButton size="small" onClick={handleAdd(v[0], i)}>
                                    <AddIcon/>
                                </IconButton>
                            </Divider>
                            <ListItem>
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                    <div style={{'flexGrow': '1'}}>
                                        <ListItemButton onClick={() => setDialogTarget(
                                            {element: props.elementType.asEditElement(v[0], handleEdit(i)), index: i})}
                                        >
                                            <ListItemText primary={props.elementType.Format(v[0])}/>
                                        </ListItemButton>
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
        </List>
        <ValueDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                     title={`index # ${dialogTarget?.index}`}>
            {dialogTarget?.element}
        </ValueDialog>
    </>
}

function ShortSequenceEdit(props: SequenceEditProps) {
    // each key of each item is a 3-tuple of a value, const key and version
    const [items, setItems] = useState(props.initalValue.map((v) => [v, uuid(), 0]))

    useEffect(() => {
        props.onChange(items.map((v) => v[0]))
    }, [items])

    const handleAdd = (v: any, idx: number) => () => {
        let newItems = items.slice();
        newItems.splice(idx, 0, [v, uuid(), 0]);
        setItems(newItems);
    }

    const handleEdit = (idx: number) => (v: any) => {
        let newItems = items.slice();
        newItems[idx][0] = v;
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
                    return <Collapse key={[v[1], v[2]].toString()}>
                        <Divider textAlign="right">
                            <IconButton size="small" onClick={handleAdd(v[0], i)}>
                                <AddIcon/>
                            </IconButton>
                        </Divider>
                        <ListItem>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <div style={{'flexGrow': '1'}}>
                                    {props.elementType.asEditElement(v[0], handleEdit(i))}
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
                })}
        </TransitionGroup>
        <Divider textAlign="right">
            <IconButton size="small" onClick={
                handleAdd(items.length == 0 ? props.elementType.defaultValue() : items[items.length - 1][0],
                    items.length)
            }>
                <AddIcon/>
            </IconButton>
        </Divider>
    </List>
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

    asEditElement(value: E[], onChange: (new_value: E[]) => void): JSX.Element {
        if (this.elementType.editElementShort()) {
            return <ShortSequenceEdit initalValue={value} elementType={this.elementType} onChange={onChange}/>
        } else {
            return <LongSequenceEdit initalValue={value} elementType={this.elementType} onChange={onChange}/>
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
        <ValueDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                     title={`key "${dialogTarget?.key}"`}>
            {dialogTarget?.element}
        </ValueDialog>
    </>
}

type MappingEditProps = {
    initialValue: Record<string, any>
    valueType: SettingType<any>
    onChange: (v: Record<string, any>) => void
}

function MappingEdit(props: MappingEditProps) {
    const [value, setValue] = useState(props.initialValue)
    const [dialogTarget, setDialogTarget] = useState<{ key: string, element: JSX.Element } | null>(null);

    const handleEdit = (key: string) => (v: any) => {
        let newValue = Object.assign({}, value);
        newValue[key] = v;
        setValue(newValue);
        props.onChange(newValue);
    }

    return <>
        <List>
            {Object.entries(value).map(([k, v], i) => {
                return <ListItem key={i.toString()}>
                    <ListItemText primary={k + ": "}/>
                    <ListItemButton onClick={() => setDialogTarget(
                        {element: props.valueType.asEditElement(v, handleEdit(k)), key: k})}
                    >
                        <ListItemText primary={props.valueType.Format(v)}/>
                    </ListItemButton>
                </ListItem>
            })}
        </List>
        <ValueDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}
                     title={`key "${dialogTarget?.key}"`}>
            {dialogTarget?.element}
        </ValueDialog>
    </>
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
        return <MappingEdit initialValue={value} valueType={this.valueType} onChange={onChange}/>
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
