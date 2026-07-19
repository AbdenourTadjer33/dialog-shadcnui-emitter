import DialogManager from '@/components/dialog-manager';
import { Button } from '@/components/ui/button';
import { closeDialog, openDialog } from '@/lib/dialogs';

export default function App() {
    return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start gap-3 p-8">
            <h1 className="text-2xl font-semibold">dialog-shadcnui-emitter demo</h1>
            <p className="text-sm text-muted-foreground">
                Every button below calls <code>openDialog()</code> — no dialog is declared on this page.
            </p>

            <Button onClick={() => openDialog({ agree: (close) => close() })}>Default confirm</Button>

            <Button
                onClick={() =>
                    openDialog({
                        title: 'Delete 3 files?',
                        message: 'This permanently removes them from the project.',
                        options: { agree: 'Delete', disagree: 'Keep' },
                        agree: (close) => close(),
                    })
                }
            >
                Custom labels
            </Button>

            <Button
                onClick={() =>
                    openDialog({
                        title: 'Custom body',
                        showActions: false,
                        modalSize: 'md',
                        customBody: (close) => (
                            <div className="flex flex-col gap-4">
                                <input className="rounded-md border px-3 py-2 text-sm" placeholder="Type something…" />
                                <Button onClick={close}>Done</Button>
                            </div>
                        ),
                    })
                }
            >
                Custom body, no footer
            </Button>

            <Button onClick={() => openDialog({ title: 'Not draggable', isDraggable: false, agree: (close) => close() })}>
                Not draggable
            </Button>

            <Button onClick={() => openDialog({ title: 'Overflow allowed', allowOverflow: true, agree: (close) => close() })}>
                Drag past edges
            </Button>

            <Button
                onClick={() => {
                    openDialog({ title: 'Closes in 2s', showActions: false });
                    setTimeout(closeDialog, 2000);
                }}
            >
                closeDialog() after 2s
            </Button>

            <Button onClick={() => openDialog({ title: 'Full size', modalSize: 'full', agree: (close) => close() })}>
                Full size
            </Button>

            <DialogManager />
        </main>
    );
}
