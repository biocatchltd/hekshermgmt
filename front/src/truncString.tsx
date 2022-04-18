import * as React from 'react';
import { Box, Stack, Chip, ChipProps } from '@mui/material';
import { HiddenString } from './hiddenString';
import DetectableOverflow from 'react-detectable-overflow';
import { Fragment } from 'react';

type TruncChipProps = {
    value: string;
    chipProps?: ChipProps;
};

/**
 * A truncated string that can be expanded to show the full string.
 */
export function TruncChip(props: TruncChipProps) {
    const [overflow, setOverflow] = React.useState(false);
    const chip = <Chip {...props.chipProps} style={{ height: '30px' }} label={props.value} />;

    return (
        <Fragment>
            <Stack direction='row' justifyContent='flex' alignItems='center'>
                <Box style={{ position: 'relative', height: '30px', width: '100%' }}>
                    <Box
                        style={{
                            position: 'absolute',
                            right: 0,
                            left: 0,
                            boxSizing: 'border-box',
                            display: 'block',
                        }}
                    >
                        <Box
                            style={{
                                boxSizing: 'border-box',
                                overflowX: 'hidden',
                                textOverflow: '',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <DetectableOverflow
                                onChange={(a: boolean) => {
                                    setOverflow(a);
                                }}
                            >
                                {chip}
                            </DetectableOverflow>
                        </Box>
                    </Box>
                </Box>
                <Box style={{ height: '30px' }}>{overflow && <HiddenString value={props.value} />}</Box>
            </Stack>
        </Fragment>
    );
}
