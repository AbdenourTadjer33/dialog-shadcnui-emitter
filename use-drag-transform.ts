import * as React from 'react';

export type DragPosition = { x: number; y: number };

export type UseDragTransformOptions = {
    /** Disable dragging (pass `!isOpen` — same convention as HeroUI's useDraggable). */
    isDisabled?: boolean;
    /** Let the dialog be dragged past the viewport edges. Mirrors HeroUI's `overflow` prop. */
    allowOverflow?: boolean;
    /** Minimum gap kept between the dialog and the viewport edge, in px. */
    margin?: number;
    /** Distance moved per arrow-key press while the handle is focused. */
    keyboardStep?: number;
};

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

const INTERACTIVE = 'button, a, input, textarea, select, [role="button"], [data-no-drag]';

export function useDragTransform({
    isDisabled = false,
    allowOverflow = false,
    margin = 8,
    keyboardStep = 16,
}: UseDragTransformOptions = {}) {
    /** The transform-only layer. Attach to the wrapper, never to the content. */
    const dragLayerRef = React.useRef<HTMLDivElement | null>(null);
    const handleElRef = React.useRef<HTMLElement | null>(null);

    const position = React.useRef<DragPosition>({ x: 0, y: 0 });
    const pointerOrigin = React.useRef<DragPosition | null>(null);
    const bounds = React.useRef<Bounds | null>(null);

    // config read through a ref so every handler below stays referentially stable
    const config = React.useRef({ isDisabled, allowOverflow, margin, keyboardStep });
    config.current = { isDisabled, allowOverflow, margin, keyboardStep };

    const write = React.useCallback(() => {
        const layer = dragLayerRef.current;
        if (!layer) return;
        const { x, y } = position.current;
        // translate3d (not the `translate` property) — best-supported composited path in WebKit
        layer.style.transform = x === 0 && y === 0 ? '' : `translate3d(${x}px, ${y}px, 0)`;
    }, []);

    const resetPosition = React.useCallback(() => {
        position.current = { x: 0, y: 0 };
        write();
    }, [write]);

    /** Bounds are measured once per gesture — never inside pointermove. */
    const measureBounds = React.useCallback((): Bounds | null => {
        const layer = dragLayerRef.current;
        if (!layer || config.current.allowOverflow) return null;

        const rect = layer.getBoundingClientRect(); // includes the current transform
        const { x, y } = position.current;
        const m = config.current.margin;

        return {
            minX: x + m - rect.left,
            maxX: x + window.innerWidth - m - rect.right,
            minY: y + m - rect.top,
            maxY: y + window.innerHeight - m - rect.bottom,
        };
    }, []);

    const applyClamped = React.useCallback(
        (x: number, y: number, b: Bounds | null) => {
            if (b) {
                // if the dialog is bigger than the viewport on an axis, leave that axis free
                if (b.minX <= b.maxX) x = x < b.minX ? b.minX : x > b.maxX ? b.maxX : x;
                if (b.minY <= b.maxY) y = y < b.minY ? b.minY : y > b.maxY ? b.maxY : y;
            }
            position.current = { x, y };
            write();
        },
        [write],
    );

    // --- pointer gesture -----------------------------------------------------

    const onPointerMove = React.useCallback(
        (event: PointerEvent) => {
            const from = pointerOrigin.current;
            if (!from) return;

            const x = position.current.x + (event.clientX - from.x);
            const y = position.current.y + (event.clientY - from.y);
            pointerOrigin.current = { x: event.clientX, y: event.clientY };

            applyClamped(x, y, bounds.current); // write-only: no layout read, no reflow
        },
        [applyClamped],
    );

    // block the mobile browser from scrolling the page mid-drag (HeroUI does the same)
    const preventTouchScroll = React.useCallback((event: TouchEvent) => event.preventDefault(), []);

    const endDrag = React.useCallback(
        (event: PointerEvent) => {
            if (!pointerOrigin.current) return;
            pointerOrigin.current = null;
            bounds.current = null;

            const handle = handleElRef.current;
            if (handle) {
                delete handle.dataset.dragging;
                if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
                handle.removeEventListener('pointermove', onPointerMove);
                handle.removeEventListener('pointerup', endDrag);
                handle.removeEventListener('pointercancel', endDrag);
            }

            document.body.style.removeProperty('user-select');
            document.body.removeEventListener('touchmove', preventTouchScroll);
        },
        [onPointerMove, preventTouchScroll],
    );

    const onPointerDown = React.useCallback(
        (event: PointerEvent) => {
            const handle = handleElRef.current;
            if (config.current.isDisabled || event.button !== 0 || !handle || !dragLayerRef.current) return;
            if ((event.target as HTMLElement).closest(INTERACTIVE)) return;

            event.preventDefault(); // suppress text selection + native image drag
            pointerOrigin.current = { x: event.clientX, y: event.clientY };
            bounds.current = measureBounds();

            handle.dataset.dragging = 'true';
            handle.setPointerCapture(event.pointerId);
            handle.addEventListener('pointermove', onPointerMove);
            handle.addEventListener('pointerup', endDrag);
            handle.addEventListener('pointercancel', endDrag);

            document.body.style.setProperty('user-select', 'none');
            document.body.addEventListener('touchmove', preventTouchScroll, { passive: false });
        },
        [endDrag, measureBounds, onPointerMove, preventTouchScroll],
    );

    // --- keyboard (accessibility parity with react-aria's useMove) ------------

    const onKeyDown = React.useCallback(
        (event: KeyboardEvent) => {
            if (config.current.isDisabled) return;
            const step = event.shiftKey ? config.current.keyboardStep * 4 : config.current.keyboardStep;

            const delta =
                event.key === 'ArrowLeft' ? { x: -step, y: 0 }
                : event.key === 'ArrowRight' ? { x: step, y: 0 }
                : event.key === 'ArrowUp' ? { x: 0, y: -step }
                : event.key === 'ArrowDown' ? { x: 0, y: step }
                : null;

            if (!delta) return;
            event.preventDefault();
            applyClamped(position.current.x + delta.x, position.current.y + delta.y, measureBounds());
        },
        [applyClamped, measureBounds],
    );

    /** Callback ref for the drag handle (your dialog header). */
    const dragHandleRef = React.useCallback(
        (node: HTMLElement | null) => {
            const previous = handleElRef.current;
            if (previous) {
                previous.removeEventListener('pointerdown', onPointerDown);
                previous.removeEventListener('keydown', onKeyDown);
            }
            handleElRef.current = node;
            if (node) {
                node.addEventListener('pointerdown', onPointerDown);
                node.addEventListener('keydown', onKeyDown);
            }
        },
        [onKeyDown, onPointerDown],
    );

    // keep the dialog reachable when the OS window is resized (matters in Tauri)
    React.useEffect(() => {
        if (isDisabled) return;
        const onResize = () => applyClamped(position.current.x, position.current.y, measureBounds());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [applyClamped, isDisabled, measureBounds]);

    React.useEffect(() => () => endDrag(new PointerEvent('pointercancel')), [endDrag]);

    return { dragLayerRef, dragHandleRef, resetPosition, position };
}