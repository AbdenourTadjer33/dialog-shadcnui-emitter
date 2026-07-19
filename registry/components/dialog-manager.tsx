'use client';

import * as React from 'react';

import {
    DraggableDialog,
    DraggableDialogBody,
    DraggableDialogContent,
    DraggableDialogDescription,
    DraggableDialogFooter,
    DraggableDialogHeader,
    DraggableDialogTitle,
} from '@/components/draggable-dialog';
import { Button } from '@/components/ui/button';
import { useDragTransform } from '@/hooks/use-drag-transform';
import {
    dialogEmitter,
    type DialogAgreeCallback,
    type DialogCustomBody,
    type DialogDisagreeCallback,
    type DialogModalSize,
    type OpenDialogInput,
} from '@/lib/dialogs';
import { cn } from '@/lib/utils';

const SIZE_CLASSES: Record<DialogModalSize, string> = {
    xs: 'sm:max-w-xs',
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    full: 'sm:max-w-none',
};

export type DialogManagerLabels = {
    title?: string;
    message?: string;
    agree?: string;
    disagree?: string;
    close?: string;
};

const DEFAULT_LABELS: Required<DialogManagerLabels> = {
    title: 'Are you sure?',
    message: 'Please confirm that you want to proceed. This action may be irreversible.',
    agree: 'Confirm',
    disagree: 'Cancel',
    close: 'Close',
};

type DialogState = {
    title: string;
    message: React.ReactNode;
    customBody?: DialogCustomBody;
    showActions: boolean;
    size: DialogModalSize;
    contentClassName?: string;
    isDraggable: boolean;
    allowOverflow: boolean;
    options: { agree: string; disagree: string };
    agree?: DialogAgreeCallback;
    disagree?: DialogDisagreeCallback;
};

/** Mount once at the app root; drive it with openDialog()/closeDialog(). */
export default function DialogManager({ labels }: { labels?: DialogManagerLabels }) {
    const mergedLabels = { ...DEFAULT_LABELS, ...labels };
    // read through a ref so the emitter handlers stay referentially stable
    const labelsRef = React.useRef(mergedLabels);
    labelsRef.current = mergedLabels;

    const [isOpen, setIsOpen] = React.useState(false);
    const [state, setState] = React.useState<DialogState | null>(null);

    const { dragLayerRef, dragHandleRef, resetPosition } = useDragTransform({
        isDisabled: !isOpen || !(state?.isDraggable ?? true),
        allowOverflow: state?.allowOverflow ?? false,
    });

    const close = React.useCallback(() => setIsOpen(false), []);

    const open = React.useCallback(
        (input: OpenDialogInput = {}) => {
            const l = labelsRef.current;
            setState({
                title: input.title ?? l.title,
                message: input.message ?? input.description ?? l.message,
                customBody: input.customBody,
                showActions: input.showActions ?? true,
                size: input.modalSize ?? 'lg',
                contentClassName: input.modalContentClassName,
                isDraggable: input.isDraggable ?? true,
                allowOverflow: input.allowOverflow ?? false,
                options: input.options ?? { agree: l.agree, disagree: l.disagree },
                agree: input.agree,
                disagree: input.disagree,
            });
            resetPosition(); // always reopen centred
            setIsOpen(true);
        },
        [resetPosition],
    );

    React.useEffect(() => {
        dialogEmitter.on('open-dialog', open);
        dialogEmitter.on('close-dialog', close);
        return () => {
            // pass the handler so we only remove OUR listener, not every subscriber
            dialogEmitter.off('open-dialog', open);
            dialogEmitter.off('close-dialog', close);
        };
    }, [close, open]);

    if (!state) return null;

    const handleAgree = () => void state.agree?.(close);

    const handleDisagree = () => {
        state.disagree?.();
        close();
    };

    const hasCustomBody = state.customBody != null;

    return (
        <DraggableDialog open={isOpen} onOpenChange={setIsOpen}>
            <DraggableDialogContent
                dragLayerRef={dragLayerRef}
                containerClassName={cn(SIZE_CLASSES[state.size], state.size === 'full' && 'h-[calc(100vh-2rem)]')}
                closeLabel={mergedLabels.close}
            >
                <DraggableDialogHeader ref={dragHandleRef} isDraggable={state.isDraggable}>
                    <DraggableDialogTitle>{state.title}</DraggableDialogTitle>
                    {hasCustomBody && <DraggableDialogDescription className="sr-only">{state.title}</DraggableDialogDescription>}
                </DraggableDialogHeader>

                <DraggableDialogBody className={state.contentClassName}>
                    {hasCustomBody ? (
                        state.customBody!(close)
                    ) : (
                        <DraggableDialogDescription className="text-sm text-foreground" asChild>
                            <div>{state.message}</div>
                        </DraggableDialogDescription>
                    )}
                </DraggableDialogBody>

                {state.showActions && (
                    <DraggableDialogFooter>
                        <Button variant="outline" onClick={handleDisagree}>
                            {state.options.disagree}
                        </Button>
                        <Button onClick={handleAgree}>{state.options.agree}</Button>
                    </DraggableDialogFooter>
                )}
            </DraggableDialogContent>
        </DraggableDialog>
    );
}