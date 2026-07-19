// hooks/use-draggable-dialog.ts
import * as React from 'react';

type Point = { x: number; y: number };

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

const NON_DRAGGABLE = 'button, a, input, textarea, select, [role="button"], [data-no-drag]';

export function useDraggableDialog<T extends HTMLElement = HTMLDivElement>({
    disabled = false,
    keepWithinViewport = true,
    margin = 8,
}: { disabled?: boolean; keepWithinViewport?: boolean; margin?: number } = {}) {
    const contentRef = React.useRef<T>(null);
    const offset = React.useRef<Point>({ x: 0, y: 0 });
    const origin = React.useRef<Point | null>(null);
    const bounds = React.useRef<Bounds | null>(null);
    const frame = React.useRef<number | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const flush = React.useCallback(() => {
        frame.current = null;
        const node = contentRef.current;
        if (node) node.style.translate = `${offset.current.x}px ${offset.current.y}px`;
    }, []);

    const schedule = React.useCallback(() => {
        if (frame.current == null) frame.current = requestAnimationFrame(flush);
    }, [flush]);

    /** Recenter the dialog. Call this every time it opens. */
    const resetPosition = React.useCallback(() => {
        if (frame.current != null) cancelAnimationFrame(frame.current);
        frame.current = null;
        offset.current = { x: 0, y: 0 };
        const node = contentRef.current;
        if (node) node.style.translate = '';
    }, []);

    const onPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            if (disabled || event.button !== 0) return;
            if ((event.target as HTMLElement).closest(NON_DRAGGABLE)) return;

            const node = contentRef.current;
            if (!node) return;

            event.preventDefault(); // kill text selection
            origin.current = { x: event.clientX, y: event.clientY };

            if (keepWithinViewport) {
                // rect already includes the current translate, so back it out
                const rect = node.getBoundingClientRect();
                const { x, y } = offset.current;
                bounds.current = {
                    minX: x + margin - rect.left,
                    maxX: x + window.innerWidth - margin - rect.right,
                    minY: y + margin - rect.top,
                    maxY: y + window.innerHeight - margin - rect.bottom,
                };
            }

            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDragging(true);
        },
        [disabled, keepWithinViewport, margin],
    );

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            const from = origin.current;
            if (!from) return;

            let x = offset.current.x + (event.clientX - from.x);
            let y = offset.current.y + (event.clientY - from.y);

            const b = bounds.current;
            if (b) {
                if (b.minX <= b.maxX) x = Math.min(Math.max(x, b.minX), b.maxX);
                if (b.minY <= b.maxY) y = Math.min(Math.max(y, b.minY), b.maxY);
            }

            offset.current = { x, y };
            origin.current = { x: event.clientX, y: event.clientY };
            schedule();
        },
        [schedule],
    );

    const endDrag = React.useCallback((event: React.PointerEvent<HTMLElement>) => {
        if (!origin.current) return;
        origin.current = null;
        bounds.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setIsDragging(false);
    }, []);

    React.useEffect(
        () => () => {
            if (frame.current != null) cancelAnimationFrame(frame.current);
        },
        [],
    );

    const dragHandleProps = disabled
        ? {}
        : { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag };

    return { contentRef, dragHandleProps, resetPosition, isDragging };
}
