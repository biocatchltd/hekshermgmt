import {
    Collapse,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Stack,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import ExtensionIcon from '@mui/icons-material/Extension';
import ExtensionOffIcon from '@mui/icons-material/ExtensionOff';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import * as React from 'react';
import { ReactNode, useState } from 'react';
import { ValueEditDialogConstContext, ValueViewDialog } from './valueDialog';
import { ControlledRadioGroup, ControlledSwitch, ControlledTextField, ControlledTransferList } from './controlledInput';
import AddIcon from '@mui/icons-material/Add';
import { TransitionGroup } from 'react-transition-group';
import { v4 as uuid } from 'uuid';
import useDeepEffect from '@lucarestagno/use-deep-effect';
import { FixedSizeList } from 'react-window';

export interface SettingType<T> {
    /**
     * The name of the setting, in heksher format
     */
    toString(): string;

    /**
     * convert a value of the type to a string
     */
    Format(value: T): string;

    /**
     * convert a value of the type to a value that can be indexed by a datatable
     */
    asData(value: T): string | number | (string | number)[];

    /**
     * convert a value of the type to a JSX element for viewing
     */
    asViewElement(value: T): JSX.Element;

    /**
     * Check whether a parsed JSON is a valid member of this type
     */
    isValid(value: any): boolean;

    /**
     * convert a value of the type to a JSX element for editing
     */
    asEditElement(
        value: T,
        onChange: (new_value: T) => void,
        onValidChange: (newError: string | null) => void,
    ): JSX.Element;

    /**
     * Is the edit element for this type small, so that it can be inlined into larger edits?
     */
    editElementShort(): boolean;

    /**
     * A sensible default value for this type
     */
    defaultValue(): T;
}

class StrSettingType implements SettingType<string> {
    toString(): string {
        return 'str';
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string {
        return value;
    }

    asViewElement(value: string): JSX.Element {
        return <Typography color='text.primary'>{value}</Typography>;
    }

    asEditElement(value: string, onChange: (new_value: string) => void): JSX.Element {
        return <ControlledTextField textFieldProps={{ multiline: true }} initialValue={value} onChange={onChange} />;
    }

    editElementShort(): boolean {
        return true;
    }

    defaultValue(): string {
        return '';
    }

    isValid(value: any): boolean {
        return typeof value === 'string';
    }
}

class IntSettingType implements SettingType<number> {
    toString(): string {
        return 'int';
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string | number {
        return value;
    }

    asViewElement(value: number): JSX.Element {
        return <Typography color='text.primary'>{value}</Typography>;
    }

    asEditElement(
        value: number,
        onChange: (new_value: number) => void,
        onValidChange: (newError: string | null) => void,
    ): JSX.Element {
        return (
            <ControlledTextField
                textFieldProps={{ multiline: true }}
                initialValue={value.toString()}
                onChange={(s) => onChange(parseInt(s))}
                errorMsg={(s) => (s.match(/^([+-])?[0-9]*$/) ? null : 'value must be a whole number')}
                onValidityChange={onValidChange}
            />
        );
    }

    editElementShort(): boolean {
        return true;
    }

    defaultValue(): number {
        return 0;
    }

    isValid(value: any): boolean {
        return typeof value === 'number' && value % 1 === 0;
    }
}

class BoolSettingType implements SettingType<boolean> {
    toString(): string {
        return 'bool';
    }

    Format(value: any): string {
        return value ? 'True' : 'False';
    }

    asData(value: any): string {
        return this.Format(value);
    }

    asViewElement(value: boolean): JSX.Element {
        return <Typography color='text.primary'>{value ? 'True' : 'False'}</Typography>;
    }

    asEditElement(value: boolean, onChange: (new_value: boolean) => void): JSX.Element {
        return <ControlledSwitch initialValue={value} onChange={onChange} />;
    }

    editElementShort(): boolean {
        return true;
    }

    defaultValue(): boolean {
        return false;
    }

    isValid(value: any): boolean {
        return typeof value === 'boolean';
    }
}

class FloatSettingType implements SettingType<number> {
    toString(): string {
        return 'float';
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string | number {
        return value;
    }

    asViewElement(value: number): JSX.Element {
        return <Typography color='text.primary'>{value}</Typography>;
    }

    asEditElement(
        value: number,
        onChange: (new_value: number) => void,
        onValidChange: (newError: string | null) => void,
    ): JSX.Element {
        return (
            <ControlledTextField
                textFieldProps={{ multiline: true }}
                initialValue={value.toString()}
                onChange={(s) => onChange(parseFloat(s))}
                errorMsg={(s) => (s.match(/^([+-])?[0-9]+(\.[0-9]+)?$/) ? null : 'value must be a number')}
                onValidityChange={onValidChange}
            />
        );
    }

    editElementShort(): boolean {
        return true;
    }

    defaultValue(): number {
        return 0;
    }

    isValid(value: any): boolean {
        return typeof value === 'number' && !isNaN(value);
    }
}

export function primitive_to_str(value: string | number | boolean): string {
    return value === true ? 'True' : value === false ? 'False' : value.toString();
}

class EnumSettingType implements SettingType<number | boolean | string> {
    values: (string | number | boolean)[];

    constructor(values: (string | number | boolean)[]) {
        this.values = values;
    }

    toString(): string {
        const parts = this.values.map((v) => JSON.stringify(v));
        parts.sort();
        return 'Enum[' + parts.join(', ') + ']';
    }

    Format(value: any): string {
        return value;
    }

    asData(value: any): string | number {
        if (value instanceof Boolean) {
            return value ? 'True' : 'False';
        }
        return value;
    }

    asViewElement(value: number | boolean | string): JSX.Element {
        const valueView = primitive_to_str(value);
        return <Typography color='text.primary'>{valueView}</Typography>;
    }

    asEditElement(
        value: number | boolean | string,
        onChange: (new_value: number | boolean | string) => void,
    ): JSX.Element {
        return (
            <ControlledRadioGroup
                options={this.values}
                optionLabels={this.values.map(primitive_to_str)}
                initialValue={value}
                onChange={onChange}
            />
        );
    }

    editElementShort(): boolean {
        return false;
    }

    defaultValue(): number | boolean | string {
        return this.values[0];
    }

    isValid(value: any): boolean {
        // @ts-ignore
        return this.values.indexOf(value) !== -1;
    }
}

type FlagsViewProps = {
    included: (string | number | boolean)[];
    excluded: (string | number | boolean)[];
};

function FlagsView(props: FlagsViewProps) {
    const [includedOpen, setIncludedOpen] = useState(true);
    const [excludedOpen, setExcludedOpen] = useState(false);

    return (
        <List>
            <ListItem onClick={() => setIncludedOpen(!includedOpen)}>
                <ListItemText primary='Included' />
                {includedOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={includedOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    {props.included.map((v, i) => (
                        <ListItem key={i}>
                            <ListItemIcon>
                                <ExtensionIcon />
                            </ListItemIcon>
                            <ListItemText primary={v} />
                        </ListItem>
                    ))}
                </List>
            </Collapse>

            <ListItem onClick={() => setExcludedOpen(!excludedOpen)}>
                <ListItemText secondary='Excluded' />
                {excludedOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={excludedOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    {props.excluded.map((v, i) => (
                        <ListItem key={i}>
                            <ListItemIcon>
                                <ExtensionOffIcon />
                            </ListItemIcon>
                            <ListItemText secondary={v} />
                        </ListItem>
                    ))}
                </List>
            </Collapse>
        </List>
    );
}

class FlagsSettingType implements SettingType<(number | boolean | string)[]> {
    values: (string | number | boolean)[];

    constructor(values: (string | number | boolean)[]) {
        this.values = values;
    }

    toString(): string {
        const parts = this.values.map((v) => JSON.stringify(v));
        parts.sort();
        return 'Flags[' + parts.join(', ') + ']';
    }

    Format(value: any): string {
        const limit = 40;
        let count = 0;
        let format = '';
        const parts = [];

        for (let i = 0; i < value.length; i++) {
            const elm = JSON.stringify(value[i]);
            count += elm.length;
            if (count <= limit || i === 0) {
                parts.push(elm);
            } else {
                break;
            }
        }

        parts.sort();

        format = '[';
        for (let i = 0; i < parts.length; i++) {
            if (i !== 0) format = format + ', ' + parts[i];
            else format = format + parts[i];
            if (parts.length < value.length && i === parts.length - 1) format = format + ', ... ';
        }
        format = format + ']';
        return format;
    }

    asViewElement(value: any[]): JSX.Element {
        value = value.slice();
        value.sort();
        const excluded = this.values.filter((v) => !value.includes(v)); // todo improve
        excluded.sort();
        return <FlagsView included={value} excluded={excluded} />;
    }

    asData(value: any): (string | number)[] {
        return value.map((v: any) => JSON.stringify(v));
    }

    asEditElement(
        value: (number | boolean | string)[],
        onChange: (new_value: (number | boolean | string)[]) => void,
    ): JSX.Element {
        const included = new Set(value);
        const excluded = new Set(this.values.filter((a) => !included.has(a)));
        return <ControlledTransferList initialExcluded={excluded} initialIncluded={included} onChange={onChange} />;
    }

    editElementShort(): boolean {
        return false;
    }

    defaultValue(): (number | boolean | string)[] {
        return [];
    }

    isValid(value: any): boolean {
        return Array.isArray(value) && value.every((v) => this.values.includes(v));
    }
}

type SequenceViewProps = {
    elementType: SettingType<any>;
    values: any[];
};

function SequenceView(props: SequenceViewProps) {
    const [dialogTarget, setDialogTarget] = useState<{ index: number; element: JSX.Element; export: string } | null>(
        null,
    );

    return (
        <>
            <List>
                {props.values.map((v, i) => {
                    return (
                        <ListItem key={i.toString()}>
                            <ListItemButton
                                onClick={() =>
                                    setDialogTarget({
                                        element: props.elementType.asViewElement(v),
                                        index: i,
                                        export: JSON.stringify(v),
                                    })
                                }
                            >
                                <ListItemText primary={props.elementType.Format(v)} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <ValueViewDialog
                open={dialogTarget !== null}
                onClose={() => setDialogTarget(null)}
                title={`index # ${dialogTarget?.index}`}
                export={dialogTarget?.export ?? ''}
            >
                {dialogTarget?.element}
            </ValueViewDialog>
        </>
    );
}

type BaseSequenceEditProps = {
    elementFactory: (v: any, i: number, cb: (v: any) => void, vcb: (v: any) => void) => JSX.Element;
    initialValue: any[];
    elementType: SettingType<any>;
    onChange: (v: any[]) => void;
    onValidityChange: (err: string) => void;
};

type RowProps = {
    index: number;
    style: React.CSSProperties;
    listItemStyle: React.CSSProperties;
    data: any[];
};

function BaseSequenceEdit(props: BaseSequenceEditProps) {
    // each item is a tuple of a value, const key, and error

    const [items, setItems] = useState(props.initialValue.map((v) => [v, uuid(), '']));

    useDeepEffect(() => {
        if (props.initialValue.length != items.length) {
            setItems(props.initialValue.map((v) => [v, uuid(), '']));
        } else {
            let any_changed = false;
            for (const idx in items) {
                if (props.initialValue[idx] != items[idx][0]) {
                    items[idx] = [props.initialValue[idx], uuid(), ''];
                    any_changed = true;
                }
            }
            if (any_changed) {
                setItems(items);
            }
        }
    }, [props.initialValue]);

    useDeepEffect(() => {
        props.onChange(items.map((v) => v[0]));
        let error = '';
        for (const idx in items) {
            const item = items[idx];
            if (item[2]) {
                error = `index #${idx}: ` + item[2];
                break;
            }
        }
        props.onValidityChange(error);
    }, [items]);

    const handleAdd = (v: any, idx: number) => () => {
        const newItems = items.slice();
        newItems.splice(idx, 0, [v, uuid(), '']);
        setItems(newItems);
    };

    const handleAddToEnd = () => () => {
        const newItems = items.slice();
        newItems.splice(items.length, 0, [
            items.length == 0 ? props.elementType.defaultValue() : items[items.length - 1][0],
            uuid(),
            '',
        ]);
        setItems(newItems);
    };

    const handleEdit = (idx: number) => (v: any) => {
        const newItems = items.slice();
        newItems[idx] = [v, newItems[idx][1], newItems[idx][2]];
        setItems(newItems);
    };

    const handleErrorChange = (idx: number) => (e: string) => {
        const newItems = items.slice();
        newItems[idx][2] = e;
        setItems(newItems);
    };

    const handleMoveUp = (idx: number) => () => {
        const newItems = items.slice();
        [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
        setItems(newItems);
    };

    const handleMoveDown = (idx: number) => handleMoveUp(idx + 1);

    const handleRemove = (idx: number) => () => {
        const newItems = items.slice();
        newItems.splice(idx, 1);
        setItems(newItems);
    };

    const Row = ({ data, index, style }: RowProps) => (
        <div style={style}>
            <TransitionGroup>
                <Collapse key={data[index][1].toString()}>
                    <Divider textAlign='right'>
                        <IconButton size='small' onClick={handleAdd(data[index][0], index)}>
                            <AddIcon />
                        </IconButton>
                    </Divider>
                    <ListItem>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{ flexGrow: '1' }}>
                                {props.elementFactory(
                                    data[index][0],
                                    index,
                                    handleEdit(index),
                                    handleErrorChange(index),
                                )}
                            </div>
                            <Stack spacing={0}>
                                <IconButton
                                    size='small'
                                    disabled={index == 0}
                                    onClick={handleMoveUp(index)}
                                    sx={{ my: '0px' }}
                                >
                                    <ArrowDropUpIcon />
                                </IconButton>
                                <IconButton size='small' onClick={handleRemove(index)} sx={{ my: '-15px' }}>
                                    <RemoveIcon />
                                </IconButton>
                                <IconButton
                                    size='small'
                                    disabled={index == items.length - 1}
                                    onClick={handleMoveDown(index)}
                                    sx={{ my: '0px' }}
                                >
                                    <ArrowDropDownIcon />
                                </IconButton>
                            </Stack>
                        </div>
                    </ListItem>
                </Collapse>
            </TransitionGroup>

            {data[data.length - 1][1].toString() === data[index][1].toString() ? (
                <Divider textAlign='right' key={data.length}>
                    <IconButton size='small' onClick={handleAddToEnd()}>
                        <AddIcon />
                    </IconButton>
                </Divider>
            ) : null}
        </div>
    );

    return (
        <List>
            <FixedSizeList height={530} itemCount={items.length} itemSize={120} width={450} itemData={items}>
                {Row}
            </FixedSizeList>
        </List>
    );
}

type SequenceEditProps = {
    initialValue: any[];
    elementType: SettingType<any>;
    onChange: (v: any[]) => void;
    onValidityChange: (err: string) => void;
};

function LongSequenceEdit(props: SequenceEditProps) {
    const [dialogProps, setDialogProps] = useState<{
        index: number;
        value: any;
        v_cb: (v: any) => void;
        err_cb: (e: string) => void;
        children_factory: (
            value: any,
            on_change_value: (new_value: any) => void,
            on_change_validity: (err: string) => void,
        ) => ReactNode;
    } | null>(null);
    return (
        <>
            <BaseSequenceEdit
                elementFactory={(v, i, cb, vcb) => (
                    <ListItemButton
                        onClick={() =>
                            setDialogProps({
                                index: i,
                                value: v,
                                v_cb: cb,
                                err_cb: vcb,
                                children_factory: (v, v_cb, err_cb) => {
                                    return props.elementType.asEditElement(v, v_cb, err_cb);
                                },
                            })
                        }
                    >
                        <ListItemText primary={props.elementType.Format(v)} />
                    </ListItemButton>
                )}
                {...props}
            />
            {dialogProps !== null && (
                <ValueEditDialogConstContext
                    open={true}
                    onClose={(ok) => {
                        if (!ok) {
                            dialogProps!.v_cb(dialogProps!.value);
                        }
                        setDialogProps(null);
                    }}
                    initial_value={dialogProps?.value}
                    title={`index #${dialogProps?.index}`}
                    on_value_changed={dialogProps!.v_cb}
                    on_validity_changed={dialogProps!.err_cb}
                    children_factory={dialogProps!.children_factory}
                    isValidValue={(v) => props.elementType.isValid(v)}
                    contextFeatures={null}
                    initialContext={null}
                />
            )}
        </>
    );
}

function ShortSequenceEdit(props: SequenceEditProps) {
    return (
        <>
            <BaseSequenceEdit
                elementFactory={(v, i, cb, vcb) => props.elementType.asEditElement(v, cb, vcb)}
                {...props}
            />
        </>
    );
}

class SequenceSettingType<E> implements SettingType<E[]> {
    elementType: SettingType<E>;

    constructor(elementType: SettingType<E>) {
        this.elementType = elementType;
    }

    toString(): string {
        return 'Sequence<' + this.elementType.toString() + '>';
    }

    Format(value: E[]): string {
        let format = '';
        const limit = 40;
        let count = 0;

        format = '[';

        for (let i = 0; i < value.length; i++) {
            const elm = this.elementType.Format(value[i]);
            count += elm.length;
            if (count <= limit || i === 0) format = format + elm + ', ';
            else {
                format = format + '... ';
                break;
            }
        }
        format = format + ']';
        return format;
    }

    asData(value: any): (string | number)[] {
        return value.map((v: any) => {
            const inner = this.elementType.asData(v);
            if (inner instanceof Array) {
                return inner.join(', ');
            }
            return inner;
        });
    }

    asViewElement(value: any[]): JSX.Element {
        return <SequenceView elementType={this.elementType} values={value} />;
    }

    asEditElement(
        value: E[],
        onChange: (new_value: E[]) => void,
        onValidChange: (newError: string | null) => void,
    ): JSX.Element {
        const props: SequenceEditProps = {
            initialValue: value,
            elementType: this.elementType,
            onChange: onChange,
            onValidityChange: onValidChange,
        };
        if (this.elementType.editElementShort()) {
            // todo we check the length because we currently render large lists very slowly, we should fix that and
            //  remove this check
            return <ShortSequenceEdit {...props} />;
        } else {
            return <LongSequenceEdit {...props} />;
        }
    }

    editElementShort(): boolean {
        return false;
    }

    defaultValue(): E[] {
        return [];
    }

    isValid(value: any): boolean {
        return Array.isArray(value) && value.every((v: any) => this.elementType.isValid(v));
    }
}

type MappingViewProps = {
    valueType: SettingType<any>;
    entries: [key: string, value: any][];
};

function MappingView(props: MappingViewProps) {
    const [dialogTarget, setDialogTarget] = useState<{ key: string; element: JSX.Element; export: string } | null>(
        null,
    );

    return (
        <>
            <List>
                {props.entries.map(([k, v], i) => {
                    return (
                        <ListItem key={i.toString()}>
                            <ListItemText primary={k + ': '} />
                            <ListItemButton
                                onClick={() =>
                                    setDialogTarget({
                                        element: props.valueType.asViewElement(v),
                                        key: k,
                                        export: JSON.stringify(v),
                                    })
                                }
                            >
                                <ListItemText primary={props.valueType.Format(v)} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <ValueViewDialog
                open={dialogTarget !== null}
                onClose={() => setDialogTarget(null)}
                title={`key "${dialogTarget?.key}"`}
                export={dialogTarget?.export ?? ''}
            >
                {dialogTarget?.element}
            </ValueViewDialog>
        </>
    );
}

type BaseMappingEditProps = {
    valueEditFactory: (v: any, k: string, cb: (v: any) => void, vcb: (v: string | null) => void) => JSX.Element;
    initialValue: Record<string, any>;
    valueType: SettingType<any>;
    onChange: (v: Record<string, any>) => void;
    onValidityChange: (err: string) => void;
};

function BaseMappingEdit(props: BaseMappingEditProps) {
    function convert_initial_value(value: Record<string, any>): [string, [any, string, string]][] {
        const ret = Object.entries(value).map(([k, v]) => [k, [v, uuid(), '']]) as [string, [any, string, string]][];
        ret.sort();
        return ret;
    }

    // each entry value is a 3-tuple of a value a const key, and the error
    const [entries, setEntries] = useState<[string, [any, string, string]][]>(() =>
        convert_initial_value(props.initialValue),
    );

    useDeepEffect(() => {
        setEntries(convert_initial_value(props.initialValue));
    }, [props.initialValue]);

    useDeepEffect(() => {
        props.onChange(Object.fromEntries(entries.map(([k, v]) => [k, v[0]])));
        // we can assume that that keys are sorted
        let previous_key: string | null = null;
        let err = '';
        for (const entry of entries) {
            const key = entry[0];
            if (key === previous_key) {
                err = `repeated key: ${key}`;
                break;
            }
            const entry_error = entry[1][2];
            if (entry_error) {
                err = `in key: ${key}: ${entry_error}`;
                break;
            }
            previous_key = key;
        }
        props.onValidityChange(err);
    }, [entries]);

    const handleEditKey = (idx: number) => (newKey: string) => {
        const newEntryItems = entries.slice();
        newEntryItems[idx][0] = newKey;
        newEntryItems.sort((a, b) => a[0].localeCompare(b[0]));
        setEntries(newEntryItems);
    };

    const handleEditValue = (idx: number) => (v: any) => {
        const newEntryItems = entries.slice();
        newEntryItems[idx] = [newEntryItems[idx][0][0], [v, newEntryItems[idx][1][1], newEntryItems[idx][1][2]]];
        setEntries(newEntryItems);
    };

    const handleAdd = () => () => {
        const newEntryItems = entries.slice();
        newEntryItems.push(['', [props.valueType.defaultValue(), uuid(), '']]);
        newEntryItems.sort((a, b) => a[0].localeCompare(b[0]));
        setEntries(newEntryItems);
    };

    const handleRemove = (idx: number) => () => {
        const newEntryItems = entries.slice();
        newEntryItems.splice(idx, 1);
        setEntries(newEntryItems);
    };

    const handleErrorChange = (idx: number) => (e: string) => {
        const newEntryItems = entries.slice();
        newEntryItems[idx][1][2] = e;
        setEntries(newEntryItems);
    };

    return (
        <>
            <List>
                <TransitionGroup>
                    {entries.map(([key, entry], idx) => {
                        return (
                            <Collapse key={entry[1].toString()}>
                                <ListItem>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <ControlledTextField
                                            textFieldProps={{ multiline: true }}
                                            initialValue={key}
                                            onChange={handleEditKey(idx)}
                                        />
                                        <ListItemText primary={' : '} />
                                        <div style={{ flexGrow: '1' }}>
                                            {props.valueEditFactory(
                                                entry[0],
                                                key,
                                                handleEditValue(idx),
                                                handleErrorChange(idx),
                                            )}
                                        </div>
                                        <IconButton size='small' onClick={handleRemove(idx)} sx={{ my: '-15px' }}>
                                            <RemoveIcon />
                                        </IconButton>
                                    </div>
                                </ListItem>
                            </Collapse>
                        );
                    })}
                </TransitionGroup>
                <Divider textAlign='right'>
                    <IconButton size='small' onClick={handleAdd()}>
                        <AddIcon />
                    </IconButton>
                </Divider>
            </List>
        </>
    );
}

type MappingEditProps = {
    initialValue: Record<string, any>;
    valueType: SettingType<any>;
    onChange: (v: Record<string, any>) => void;
    onValidityChange: (err: string) => void;
};

function LongMappingEdit(props: MappingEditProps) {
    const [dialogProps, setDialogProps] = useState<{
        key: string;
        value: any;
        v_cb: (v: any) => void;
        err_cb: (e: string) => void;
        children_factory: (
            value: any,
            on_change_value: (new_value: any) => void,
            on_change_validity: (err: string) => void,
        ) => ReactNode;
    } | null>(null);
    return (
        <>
            <BaseMappingEdit
                valueEditFactory={(v, k, cb, valid_cb) => (
                    <ListItemButton
                        onClick={() =>
                            setDialogProps({
                                key: k,
                                value: v,
                                v_cb: cb,
                                err_cb: valid_cb,
                                children_factory: (v, v_cb, err_cb) => {
                                    return props.valueType.asEditElement(v, v_cb, err_cb);
                                },
                            })
                        }
                    >
                        <ListItemText primary={props.valueType.Format(v)} />
                    </ListItemButton>
                )}
                {...props}
            />
            {dialogProps !== null && (
                <ValueEditDialogConstContext
                    open={true}
                    onClose={(ok) => {
                        if (!ok) {
                            dialogProps!.v_cb(dialogProps!.value);
                        }
                        setDialogProps(null);
                    }}
                    initial_value={dialogProps?.value}
                    title={`key: ${dialogProps?.key}`}
                    on_value_changed={dialogProps!.v_cb}
                    on_validity_changed={dialogProps!.err_cb}
                    children_factory={dialogProps!.children_factory}
                    isValidValue={(v) => props.valueType.isValid(v)}
                    contextFeatures={null}
                    initialContext={null}
                />
            )}
        </>
    );
}

function ShortMappingEdit(props: MappingEditProps) {
    return (
        <BaseMappingEdit valueEditFactory={(v, k, cb, vcb) => props.valueType.asEditElement(v, cb, vcb)} {...props} />
    );
}

class MapSettingType<V> implements SettingType<Record<string, V>> {
    valueType: SettingType<V>;

    constructor(valueType: SettingType<V>) {
        this.valueType = valueType;
    }

    toString(): string {
        return 'Mapping<' + this.valueType.toString() + '>';
    }

    Format(value: Record<string, V>): string {
        let format = '';
        const limit = 40;
        let index = 0;
        let count = 0;

        let isShortened = false;

        format = '{';
        for (const [k, v] of Object.entries(value)) {
            const elm = k + ': ' + this.valueType.Format(v);
            count += elm.length;
            if (count <= limit || index === 0) format = format + elm + ', ';
            else {
                format = format + '...';
                isShortened = true;
                break;
            }
            index++;
        }
        if (!isShortened) format = format.slice(0, -2);
        format = format + '}';
        return format;

    }

    asData(value: any): string | number {
        return this.Format(value);
    }

    asViewElement(value: any): JSX.Element {
        const entries = Object.entries(value);
        entries.sort(([k1], [k2]) => k1.localeCompare(k2));
        return <MappingView entries={entries} valueType={this.valueType} />;
    }

    asEditElement(
        value: Record<string, V>,
        onChange: (new_value: Record<string, V>) => void,
        onValidChange: (newError: string | null) => void,
    ): JSX.Element {
        const props: MappingEditProps = {
            initialValue: value,
            valueType: this.valueType,
            onChange: onChange,
            onValidityChange: onValidChange,
        };
        if (this.valueType.editElementShort() && Object.keys(value).length < 50) {
            // todo we check the length because we currently render large lists very slowly, we should fix that and
            //  remove this check
            return <ShortMappingEdit {...props} />;
        } else {
            return <LongMappingEdit {...props} />;
        }
    }

    editElementShort(): boolean {
        return false;
    }

    defaultValue(): Record<string, V> {
        return {};
    }

    isValid(value: Record<string, V>): boolean {
        return (
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null &&
            Object.entries(value).every(([, v]) => this.valueType.isValid(v))
        );
    }
}

export function settingType(type: string): SettingType<any> {
    switch (type) {
        case 'str':
            return new StrSettingType();
        case 'int':
            return new IntSettingType();
        case 'bool':
            return new BoolSettingType();
        case 'float':
            return new FloatSettingType();
    }

    if (type.startsWith('Enum[')) {
        const parts = type.substring(5, type.length - 1).split(',');
        const values = parts.map((v) => JSON.parse(v));
        return new EnumSettingType(values);
    }
    if (type.startsWith('Flags[')) {
        const parts = type.substring(6, type.length - 1).split(',');
        const values = parts.map((v) => JSON.parse(v));
        return new FlagsSettingType(values);
    }
    if (type.startsWith('Sequence<')) {
        const inner = type.substring(9, type.length - 1);
        const elementType = settingType(inner);
        return new SequenceSettingType(elementType);
    }
    if (type.startsWith('Mapping<')) {
        const inner = type.substring(8, type.length - 1);
        const valueType = settingType(inner);
        return new MapSettingType(valueType);
    }
    throw new Error('Unknown setting type: ' + type);
}
