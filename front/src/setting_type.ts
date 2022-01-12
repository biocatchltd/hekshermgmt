import {Component} from "react";

export interface SettingType {
    toString(): string;

    Format(value: any): string;
    asData(value: any): string | number | (string | number)[];

    viewComponent(value: any): Component | null;
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

    viewComponent(value: any): Component | null {
        return null;
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

    viewComponent(value: any): Component | null {
        return null;
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

    viewComponent(value: any): Component | null {
        return null;
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

    viewComponent(value: any): Component | null {
        return null;
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
        if (value instanceof Boolean){
            return value ? "True" : "False";
        }
        return value;
    }

    viewComponent(value: any): Component | null {
        return null;
    }
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
        let parts = this.values.map((v) => JSON.stringify(v));
        parts.sort();
        return "[" + parts.join(", ") + "]";
    }

    asData(value: any): (string | number)[] {
        return value.map((v:any) => JSON.stringify(v));
    }

    viewComponent(value: any): Component | null {
        return null;
    }
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
        return "[" + value.map((v: any) => this.elementType.Format(v)).join(", ")+ "]";
    }

    asData(value: any): (string | number)[] {
        return value.map((v: any) => {
            let inner = this.elementType.asData(v)
            if (inner instanceof Array){
                return inner.join(", ");
            }
            return inner;
        });
    }

    viewComponent(value: any): Component | null {
        return null;
    }
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
        return "{"+Object.entries(value).map(([k, v]) => k + ": " + this.valueType.Format(v)).join(", ")+"}";
    }

    asData(value: any): string | number {
        return this.Format(value);
    }

    viewComponent(value: any): Component | null {
        return null;
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
        let parts = type.substring(5, type.length-1).split(",");
        let values = parts.map((v) => JSON.parse(v));
        return new EnumSettingType(values);
    }
    if (type.startsWith("Flags[")) {
        let parts = type.substring(6, type.length-1).split(",");
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
