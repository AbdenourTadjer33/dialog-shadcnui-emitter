# dialog-shadcnui-emitter

Draggable, emitter-driven dialogs for shadcn/ui — mount one `<DialogManager />`,
then open dialogs from anywhere with `openDialog()`. No per-page `<Dialog>`
declarations, no context provider, no re-render storms while dragging.

- **Draggable** — a dedicated transform-only layer; dragging never repaints the dialog content. Keyboard-accessible (arrow keys on the focused header).
- **Imperative** — `openDialog({ title, message, agree })` from any code, React or not, via a typed [mitt](https://github.com/developit/mitt) emitter.
- **Yours** — installed with the shadcn CLI, the code lands in your project. Tweak anything.

## Install

The whole system (hook + components + manager):

```bash
npx shadcn@latest add https://abdenourtadjer33.github.io/dialog-shadcnui-emitter/r/dialog-manager.json
```

Only the declarative draggable dialog (no emitter):

```bash
npx shadcn@latest add https://abdenourtadjer33.github.io/dialog-shadcnui-emitter/r/draggable-dialog.json
```

Only the drag hook:

```bash
npx shadcn@latest add https://abdenourtadjer33.github.io/dialog-shadcnui-emitter/r/use-drag-transform.json
```

## Usage

Mount the manager once, at the app root:

```tsx
import DialogManager from '@/components/dialog-manager';

export default function AppRoot({ children }) {
    return (
        <>
            {children}
            <DialogManager />
        </>
    );
}
```

Open dialogs from anywhere:

```tsx
import { openDialog, closeDialog } from '@/lib/dialogs';

openDialog({
    title: 'Delete 3 files?',
    message: 'This permanently removes them from the project.',
    options: { agree: 'Delete', disagree: 'Keep' },
    agree: async (close) => {
        await deleteFiles();
        close(); // the dialog only closes when YOU say so
    },
});
```

Custom body (form, wizard, anything):

```tsx
openDialog({
    title: 'Rename project',
    showActions: false,
    customBody: (close) => <RenameForm onDone={close} />,
});
```

### Localization

Defaults are English. Set your language once at the mount point:

```tsx
<DialogManager
    labels={{
        title: 'Êtes-vous sûr ?',
        message: 'Veuillez confirmer que vous souhaitez poursuivre cette action.',
        agree: 'Confirmer',
        disagree: 'Annuler',
        close: 'Fermer',
    }}
/>
```

### `openDialog()` options

| Option | Type | Default | |
| --- | --- | --- | --- |
| `title` | `string` | labels.title | Header text |
| `message` / `description` | `ReactNode` | labels.message | Body text (`message` wins) |
| `customBody` | `(close) => ReactNode` | — | Replaces `message` |
| `showActions` | `boolean` | `true` | Show footer buttons |
| `options` | `{ agree, disagree }` | labels | Footer button labels |
| `agree` | `(close) => void \| Promise<void>` | — | Confirm handler; call `close()` to dismiss |
| `disagree` | `() => void` | — | Cancel handler; closes after |
| `modalSize` | `'xs'…'5xl' \| 'full'` | `'lg'` | Max-width preset |
| `modalContentClassName` | `string` | — | Extra body classes |
| `isDraggable` | `boolean` | `true` | |
| `allowOverflow` | `boolean` | `false` | Allow dragging past viewport edges |

## Development

```bash
npm install
npm run dev            # demo playground
npm run typecheck
npm run registry:build # generates public/r/*.json
```

## License

[MIT](./LICENSE)
