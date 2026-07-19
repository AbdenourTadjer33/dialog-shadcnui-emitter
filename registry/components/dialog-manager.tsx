import emitter from '@/lib/emitter';
import {
    DraggableDialog,
    DraggableDialogBody,
    DraggableDialogContent,
    DraggableDialogDescription,
    DraggableDialogFooter,
    DraggableDialogHeader,
    DraggableDialogTitle,
} from '@/components/ui/draggable-dialog';
import { useDragTransform } from '@/hooks/use-drag-transform';
import { cn } from '@/lib/utils';
import type {
    DialogAgreeCallback,
    DialogCustomBody,
    DialogDisagreeCallback,
    DialogModalSize,
    OpenDialogInput,
} from '@/services/dialogs/dialog.types';
import React from 'react';
import { Button } from '../ui/button';

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

const DEFAULT_STATE: DialogState = {
    title: 'Êtes-vous sûr ?',
    message: 'Veuillez confirmer que vous souhaitez poursuivre cette action. Cette action pourrait être irréversible.',
    showActions: true,
    size: 'lg',
    isDraggable: true,
    allowOverflow: false,
    options: { agree: 'Confirmer', disagree: 'Annuler' },
};

export default function DialogManager() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [state, setState] = React.useState<DialogState>(DEFAULT_STATE);

    const { dragLayerRef, dragHandleRef, resetPosition } = useDragTransform({
        isDisabled: !isOpen || !state.isDraggable,
        allowOverflow: state.allowOverflow,
    });

    const close = React.useCallback(() => setIsOpen(false), []);

    const open = React.useCallback(
        (input: OpenDialogInput = {}) => {
            setState({
                title: input.title ?? DEFAULT_STATE.title,
                message: input.message ?? input.description ?? DEFAULT_STATE.message,
                customBody: input.customBody,
                showActions: input.showActions ?? true,
                size: input.modalSize ?? 'lg',
                contentClassName: input.modalContentClassName,
                isDraggable: input.isDraggable ?? true,
                allowOverflow: input.allowOverflow ?? false,
                options: input.options ?? DEFAULT_STATE.options,
                agree: input.agree,
                disagree: input.disagree,
            });
            resetPosition(); // always reopen centred
            setIsOpen(true);
        },
        [resetPosition],
    );

    const handleAgree = () => void state.agree?.(close);

    const handleDisagree = () => {
        state.disagree?.();
        close();
    };

    React.useEffect(() => {
        // @ts-expect-error emitter payload is dynamic and shared across legacy dialog callsites
        emitter.on('open-dialog', open);
        emitter.on('close-dialog', close);
        return () => {
            // pass the handler so we only remove OUR listener, not every subscriber
            // @ts-expect-error same as above
            emitter.off('open-dialog', open);
            emitter.off('close-dialog', close);
        };
    }, [close, open]);

    const hasCustomBody = state.customBody != null;

    return (
        <DraggableDialog open={isOpen} onOpenChange={setIsOpen}>
            <DraggableDialogContent
                dragLayerRef={dragLayerRef}
                containerClassName={cn(SIZE_CLASSES[state.size], state.size === 'full' && 'h-[calc(100vh-2rem)]')}
                closeLabel="Fermer"
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