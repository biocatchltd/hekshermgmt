import {Collapse, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography} from "@mui/material";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import ExtensionIcon from '@mui/icons-material/Extension';
import ExtensionOffIcon from '@mui/icons-material/ExtensionOff';
import * as React from "react";
import {useState} from "react";
import {ValueDialog} from "./value_dialog";

export interface SettingType {
    toString(): string;

    Format(value: any): string;

    asData(value: any): string | number | (string | number)[];

    asViewElement(value: any): JSX.Element;
}

class StrSettingType implements SettingType {
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
}

class IntSettingType implements SettingType {
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
}

class BoolSettingType implements SettingType {
    toString(): string {
        return "bool";
    }

    Format(value: any): string {
        return value ? "True" : "False";
    }

    asData(value: any): string {
        return this.Format(value);
    }

    asViewElement(value: number): JSX.Element {
        return <Typography color="text.primary">{value ? "True" : "False"}</Typography>;
    }
}

class FloatSettingType implements SettingType {
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
}

class EnumSettingType implements SettingType {
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

    asViewElement(value: string): JSX.Element {
        return <Typography color="text.primary">{value}</Typography>;
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

class FlagsSettingType implements SettingType {
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
}


type SequenceViewProps = {
    elementType: SettingType;
    values: any[];
}


function SequenceView(props: SequenceViewProps) {
    const [dialogTarget, setDialogTarget] = useState<{index:number, element: JSX.Element} | null>(null);

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
        <ValueDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)} title={`index # ${dialogTarget?.index}`}>
            {dialogTarget?.element}
        </ValueDialog>
    </>
}

class SequenceSettingType implements SettingType {
    elementType: SettingType;

    constructor(elementType: SettingType) {
        this.elementType = elementType;
    }

    toString(): string {
        return "Sequence<" + this.elementType.toString() + ">";
    }

    Format(value: any): string {
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
}

type MappingViewProps = {
    valueType: SettingType;
    entries: [key: string, value: any][];
}


function MappingView(props: MappingViewProps) {
    const [dialogTarget, setDialogTarget] = useState<{key:string, element: JSX.Element} | null>(null);

    return <>
        <List>
            {props.entries.map(([k,v], i) => {
                return <ListItem key={i.toString()}>
                    <ListItemText primary={k+": "}/>
                    <ListItemButton onClick={() => setDialogTarget(
                        {element: props.valueType.asViewElement(v), key: k})}
                    >
                        <ListItemText primary={props.valueType.Format(v)}/>
                    </ListItemButton>
                </ListItem>
            })}
        </List>
        <ValueDialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)} title={`key "${dialogTarget?.key}"`}>
            {dialogTarget?.element}
        </ValueDialog>
    </>
}


class MapSettingType implements SettingType {
    valueType: SettingType;

    constructor(valueType: SettingType) {
        this.valueType = valueType;
    }

    toString(): string {
        return "Mapping<" + this.valueType.toString() + ">";
    }

    Format(value: any): string {
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
}

export function settingType(type: string): SettingType {
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
