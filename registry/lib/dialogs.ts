import mitt from 'mitt';
import type * as React from 'react';

export type DialogModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

/** Renders a fully custom dialog body. Receives a `close` function. */
export type DialogCustomBody = (close: () => void) => React.ReactNode;

/** Called on confirm. Receives `close` — the dialog only closes if you call it. */
export type DialogAgreeCallback = (close: () => void) => void | Promise<void>;

/** Called on cancel; the dialog closes right after. */
export type DialogDisagreeCallback = () => void;

export type OpenDialogInput = {
    title?: string;
    /** Body text. Takes precedence over `description`. */
    message?: React.ReactNode;
    /** Alias for `message` for call sites that read better with "description". */
    description?: React.ReactNode;
    /** Custom body renderer; replaces `message` when set. */
    customBody?: DialogCustomBody;
    /** Show the agree/disagree footer. Default `true`. */
    showActions?: boolean;
    /** Max-width preset. Default `'lg'`. */
    modalSize?: DialogModalSize;
    /** Extra classes applied to the dialog body. */
    modalContentClassName?: string;
    /** Default `true`. */
    isDraggable?: boolean;
    /** Allow dragging past the viewport edges. Default `false`. */
    allowOverflow?: boolean;
    /** Footer button labels; defaults come from `<DialogManager labels>`. */
    options?: { agree: string; disagree: string };
    agree?: DialogAgreeCallback;
    disagree?: DialogDisagreeCallback;
};

export type DialogEvents = {
    'open-dialog': OpenDialogInput;
    'close-dialog': undefined;
};

export const dialogEmitter = mitt<DialogEvents>();

/** Open the app-wide dialog from anywhere — no React context needed. */
export function openDialog(input: OpenDialogInput = {}): void {
    dialogEmitter.emit('open-dialog', input);
}

/** Close the app-wide dialog from anywhere. */
export function closeDialog(): void {
    dialogEmitter.emit('close-dialog');
}
