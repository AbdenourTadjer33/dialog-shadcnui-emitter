import emitter from '@/lib/emitter';
import { useDraggableDialog } from '@/hooks/use-draggable-dialog';
import type {
    DialogAgreeCallback,
    DialogCustomBody,
    DialogDisagreeCallback,
    DialogModalSize,
    OpenDialogInput,
} from '@/services/dialogs/dialog.types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
    full: 'sm:max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
};

type DialogState = {
    title: string;
    message: React.ReactNode;
    customBody?: DialogCustomBody;
    showActions: boolean;
    size: DialogModalSize;
    contentClassName?: string;
    options: { agree: string; disagree: string };
    agree?: DialogAgreeCallback;
    disagree?: DialogDisagreeCallback;
};

const INITIAL_STATE: DialogState = {
    title: 'Êtes-vous sûr ?',
    message: '',
    showActions: true,
    size: 'lg',
    options: { agree: 'Confirmer', disagree: 'Annuler' },
};

export default function DialogManager() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [state, setState] = React.useState<DialogState>(INITIAL_STATE);
    const { contentRef, dragHandleProps, resetPosition, isDragging } = useDraggableDialog();

    const close = React.useCallback(() => setIsOpen(false), []);

    const open = React.useCallback(
        (input: OpenDialogInput = {}) => {
            setState({
                title: input.title ?? INITIAL_STATE.title,
                message:
                    input.message ??
                    input.description ??
                    'Veuillez confirmer que vous souhaitez poursuivre cette action. Cette action pourrait être irréversible.',
                customBody: input.customBody,
                showActions: input.showActions ?? true,
                size: input.modalSize ?? 'lg',
                contentClassName: input.modalContentClassName,
                options: input.options ?? INITIAL_STATE.options,
                agree: input.agree,
                disagree: input.disagree,
            });
            resetPosition();
            setIsOpen(true);
        },
        [resetPosition],
    );

    const handleAgree = () => state.agree?.(close);

    const handleDisagree = () => {
        state.disagree?.();
        close();
    };

    React.useEffect(() => {
        // @ts-expect-error emitter payload is dynamic and shared across legacy dialog callsites
        emitter.on('open-dialog', open);
        emitter.on('close-dialog', close);
        return () => {
            // @ts-expect-error same as above
            emitter.off('open-dialog', open);
            emitter.off('close-dialog', close);
        };
    }, [open, close]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                ref={contentRef}
                className={cn('gap-0 p-0', SIZE_CLASSES[state.size], isDragging && 'select-none')}
                onInteractOutside={(event) => {
                    if (isDragging) event.preventDefault();
                }}
            >
                <DialogHeader
                    {...dragHandleProps}
                    className={cn(
                        'touch-none space-y-0 border-b bg-muted px-6 py-4',
                        isDragging ? 'cursor-grabbing' : 'cursor-grab',
                    )}
                >
                    <DialogTitle>{state.title}</DialogTitle>
                    {state.customBody != null && (
                        <DialogDescription className="sr-only">{state.title}</DialogDescription>
                    )}
                </DialogHeader>

                {state.customBody != null ? (
                    <div className={cn('px-6 py-4', state.contentClassName)}>{state.customBody(close)}</div>
                ) : (
                    <DialogDescription className={cn('px-6 py-4 text-sm', state.contentClassName)} asChild>
                        <div>{state.message}</div>
                    </DialogDescription>
                )}

                {state.showActions && (
                    <DialogFooter className="border-t bg-muted/30 px-6 py-4">
                        <Button variant="outline" onClick={handleDisagree}>
                            {state.options.disagree}
                        </Button>
                        <Button onClick={handleAgree}>{state.options.agree}</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
