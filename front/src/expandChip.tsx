import * as React from 'react';
import { ChipProps, Chip, Tooltip } from '@mui/material';

type ExpandChipProps = {
    value: string;
    tooltip: string;
    chip_props?: ChipProps;
};

export function ExpandChip(props: ExpandChipProps) {
    const chip = <Chip {...props.chip_props} label={props.value} />;
    const tooltip_div = (
        <div style={{ textAlign: 'center' }}>
            <span style={{ whiteSpace: 'pre-line' }}>{props.tooltip}</span>
        </div>
    );
    return <Tooltip title={tooltip_div}>{chip}</Tooltip>;
}
