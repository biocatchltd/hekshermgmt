import * as React from 'react';
import { Drawer, DrawerProps } from '@mui/material';
import { useEffect } from 'react';

type ResizableDrawerProps = {
    minWidth: number;
    maxWidth: number;
    children: React.ReactNode;
    drawerProps?: DrawerProps;
    onWidthChange?: (width: number) => void;
};

const INITAL_WIDTH = 300;

export function ResizableDrawer(props: ResizableDrawerProps) {
    const [width, setWidth] = React.useState(INITAL_WIDTH);

    useEffect(() => {
        props.onWidthChange && props.onWidthChange(width);
    }, [width]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const onMouseMove = (mouse_event: MouseEvent) => {
            const newWidth = document.body.scrollWidth - mouse_event.clientX + 44;
            if (newWidth >= props.minWidth && newWidth <= props.maxWidth) {
                setWidth(newWidth);
            }
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    return (
        <Drawer
            sx={{ flexShrink: 0 }}
            PaperProps={{ style: { width: width, paddingLeft: 16, paddingTop: 30 } }}
            {...props.drawerProps}
        >
            <div
                onMouseDown={(e) => handleMouseDown(e)}
                style={{
                    width: '5px',
                    cursor: 'ew-resize',
                    padding: '4px 0 0',
                    borderTop: '1px solid #ddd',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    zIndex: 100,
                    backgroundColor: '#f4f7f9',
                }}
            />
            {props.children}
        </Drawer>
    );
}
