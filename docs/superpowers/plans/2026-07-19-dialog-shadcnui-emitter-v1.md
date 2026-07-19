# dialog-shadcnui-emitter v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this repo into a shadcn-style component registry serving three items (`use-drag-transform`, `draggable-dialog`, `dialog-manager`) from GitHub Pages, so any project can install the emitter-driven draggable dialog system with `npx shadcn add <url>`.

**Architecture:** Registry source files live under `registry/` at consumer-shaped paths (`hooks/`, `components/`, `lib/`), with the repo's `@/*` alias pointing at `registry/` so the exact same import specifiers type-check here and in consuming projects. `registry.json` defines the items; `npx shadcn build` bundles them into `public/r/*.json`; a GitHub Actions workflow publishes `public/` to GitHub Pages. A Vite playground in `demo/` provides manual drag testing.

**Tech Stack:** React 19, TypeScript, Radix Dialog, mitt, Tailwind CSS v4, Vite, shadcn CLI, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-07-19-dialog-shadcnui-emitter-design.md`

## Global Constraints

- Registry base URL (exact, everywhere): `https://abdenourtadjer33.github.io/dialog-shadcnui-emitter`
- Item names (exact): `use-drag-transform`, `draggable-dialog`, `dialog-manager`
- English default labels (exact strings): title `Are you sure?`, message `Please confirm that you want to proceed. This action may be irreversible.`, agree `Confirm`, disagree `Cancel`, close `Close`
- `mitt` is the only npm dependency added by the `dialog-manager` item; the emitter must be typed (`mitt<DialogEvents>`) with zero `@ts-expect-error`
- Registry source imports must be consumer-shaped: `@/hooks/use-drag-transform`, `@/components/draggable-dialog`, `@/lib/dialogs`, `@/lib/utils`, `@/components/ui/button`
- `registry/lib/utils.ts` and `registry/components/ui/button.tsx` are dev/demo-only stubs — never registry items; consumers get them via registryDependencies `utils` and `button`
- No automated interaction tests in v1 — verification is `tsc --noEmit`, `shadcn build`, and manual demo testing
- Do not modify drag-hook behavior; `use-drag-transform.ts` moves verbatim

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json` (via npm), `tsconfig.json`, `.gitignore`

**Interfaces:**
- Produces: `@/*` path alias → `registry/*` used by every later task; `npm run typecheck` and `npm run registry:build` scripts.

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
public/r/
dist/
*.log
```

- [ ] **Step 2: Install dependencies**

```bash
cd /home/omen/Projects/idea/dialog-shadcnui-emitter
npm init -y
npm install react react-dom @radix-ui/react-dialog @radix-ui/react-slot lucide-react mitt clsx tailwind-merge class-variance-authority
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss @tailwindcss/vite shadcn
```

Expected: both installs succeed; `package.json` and `package-lock.json` created.

- [ ] **Step 3: Set package fields and scripts**

Edit `package.json` so it contains (keep npm-generated dependency versions):

```json
{
    "name": "dialog-shadcnui-emitter",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "typecheck": "tsc --noEmit",
        "registry:build": "shadcn build"
    }
}
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "moduleResolution": "bundler",
        "jsx": "react-jsx",
        "strict": true,
        "noEmit": true,
        "isolatedModules": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "baseUrl": ".",
        "paths": { "@/*": ["registry/*"] }
    },
    "include": ["registry", "demo"]
}
```

- [ ] **Step 5: Verify typecheck runs**

Run: `npm run typecheck`
Expected: errors from the three root `.tsx`/`.ts` files (unresolved `@/lib/emitter`, `@/services/dialogs/dialog.types`, `@/lib/utils`, `@/components/ui/draggable-dialog`, `@/hooks/use-drag-transform`) — the command itself must run, not crash. These files move in Task 2.

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json
git commit -m "chore: scaffold npm project with TypeScript and registry-shaped @ alias"
```

---

### Task 2: Move sources into `registry/` layout + dev-only shadcn stubs

**Files:**
- Move: `use-drag-transform.ts` → `registry/hooks/use-drag-transform.ts` (verbatim)
- Move: `draggable-dialog.tsx` → `registry/components/draggable-dialog.tsx` (one default changed)
- Move: `dialog-manager.tsx` → `registry/components/dialog-manager.tsx` (reworked in Task 4)
- Create: `registry/lib/utils.ts`, `registry/components/ui/button.tsx` (dev/demo-only)

**Interfaces:**
- Produces: `@/hooks/use-drag-transform` exporting `useDragTransform({ isDisabled?, allowOverflow?, margin?, keyboardStep? })` → `{ dragLayerRef, dragHandleRef, resetPosition, position }`; `@/components/draggable-dialog` exporting `DraggableDialog`, `DraggableDialogTrigger`, `DraggableDialogClose`, `DraggableDialogOverlay`, `DraggableDialogContent` (props incl. `dragLayerRef`, `containerClassName`, `showCloseButton`, `closeLabel`), `DraggableDialogHeader` (props incl. `isDraggable`), `DraggableDialogBody`, `DraggableDialogFooter`, `DraggableDialogTitle`, `DraggableDialogDescription`; `@/lib/utils` exporting `cn`; `@/components/ui/button` exporting `Button`, `buttonVariants`.

- [ ] **Step 1: Move the files**

```bash
mkdir -p registry/hooks registry/components/ui registry/lib
git mv use-drag-transform.ts registry/hooks/use-drag-transform.ts
git mv draggable-dialog.tsx registry/components/draggable-dialog.tsx
git mv dialog-manager.tsx registry/components/dialog-manager.tsx
```

- [ ] **Step 2: English close label in `registry/components/draggable-dialog.tsx`**

Change the `closeLabel` default (only this line changes in the file):

```tsx
  closeLabel = "Close",
```

- [ ] **Step 3: Create `registry/lib/utils.ts`**

```ts
// Dev/demo-only stub. Not a registry item — consumers get `utils` from the
// official shadcn registry via registryDependencies.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create `registry/components/ui/button.tsx`**

```tsx
// Dev/demo-only stub. Not a registry item — consumers get `button` from the
// official shadcn registry via registryDependencies.
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
                destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20',
                outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2 has-[>svg]:px-3',
                sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
                lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
                icon: 'size-9',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'button';
    return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
```

- [ ] **Step 5: Verify partial typecheck**

Run: `npm run typecheck`
Expected: errors ONLY in `registry/components/dialog-manager.tsx` (unresolved `@/lib/emitter`, `@/services/dialogs/dialog.types`, `@/components/ui/draggable-dialog`, `../ui/button`). `use-drag-transform.ts`, `draggable-dialog.tsx`, `utils.ts`, `button.tsx` must be error-free.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move sources into registry/ layout, add dev-only shadcn stubs"
```

---

### Task 3: `registry/lib/dialogs.ts` — typed emitter + imperative API

**Files:**
- Create: `registry/lib/dialogs.ts`

**Interfaces:**
- Produces: `dialogEmitter` (`mitt<DialogEvents>`), `openDialog(input?: OpenDialogInput): void`, `closeDialog(): void`, types `DialogModalSize`, `DialogCustomBody`, `DialogAgreeCallback`, `DialogDisagreeCallback`, `OpenDialogInput`, `DialogEvents`. Task 4 and the demo consume all of these from `@/lib/dialogs`.

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify the new file type-checks**

Run: `npm run typecheck`
Expected: zero errors mentioning `registry/lib/dialogs.ts`. (Errors in `dialog-manager.tsx` remain until Task 4.)

- [ ] **Step 3: Commit**

```bash
git add registry/lib/dialogs.ts
git commit -m "feat: add typed mitt emitter with openDialog/closeDialog API"
```

---

### Task 4: Rework `dialog-manager.tsx` — typed emitter, English defaults, `labels` prop

**Files:**
- Rewrite: `registry/components/dialog-manager.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–3 (`@/lib/dialogs`, `@/components/draggable-dialog`, `@/hooks/use-drag-transform`, `@/components/ui/button`, `@/lib/utils`).
- Produces: `export default function DialogManager({ labels }: { labels?: DialogManagerLabels })`; `export type DialogManagerLabels = { title?: string; message?: string; agree?: string; disagree?: string; close?: string }`. The demo mounts `<DialogManager />` once.

- [ ] **Step 1: Replace the file's entire contents**

```tsx
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
```

- [ ] **Step 2: Verify the whole repo type-checks**

Run: `npm run typecheck`
Expected: exit code 0, zero errors. Confirm there is no `@ts-expect-error` left: `grep -rn "ts-expect-error" registry/` → no output.

- [ ] **Step 3: Commit**

```bash
git add registry/components/dialog-manager.tsx
git commit -m "feat: typed emitter wiring, English defaults, configurable labels prop"
```

---

### Task 5: `registry.json` + `shadcn build`

**Files:**
- Create: `registry.json`
- Generated: `public/r/use-drag-transform.json`, `public/r/draggable-dialog.json`, `public/r/dialog-manager.json` (gitignored; built in CI)

**Interfaces:**
- Consumes: the four files under `registry/` (paths exact).
- Produces: install URLs `https://abdenourtadjer33.github.io/dialog-shadcnui-emitter/r/<item>.json` used by the workflow (Task 7) and README (Task 8).

- [ ] **Step 1: Create `registry.json`**

```json
{
    "$schema": "https://ui.shadcn.com/schema/registry.json",
    "name": "dialog-shadcnui-emitter",
    "homepage": "https://abdenourtadjer33.github.io/dialog-shadcnui-emitter",
    "items": [
        {
            "name": "use-drag-transform",
            "type": "registry:hook",
            "title": "useDragTransform",
            "description": "Transform-only drag hook: composited translate3d layer, pointer capture, viewport bounds clamping, keyboard arrow-key movement.",
            "files": [{ "path": "registry/hooks/use-drag-transform.ts", "type": "registry:hook" }]
        },
        {
            "name": "draggable-dialog",
            "type": "registry:component",
            "title": "Draggable Dialog",
            "description": "shadcn-style composable dialog on Radix with a dedicated transform-only drag layer, scrollable body, and sticky header/footer.",
            "dependencies": ["@radix-ui/react-dialog", "lucide-react"],
            "registryDependencies": ["utils"],
            "files": [{ "path": "registry/components/draggable-dialog.tsx", "type": "registry:component" }]
        },
        {
            "name": "dialog-manager",
            "type": "registry:component",
            "title": "Dialog Manager",
            "description": "App-wide imperative dialog driven by a typed mitt emitter: mount once, then openDialog()/closeDialog() from anywhere.",
            "dependencies": ["mitt"],
            "registryDependencies": [
                "button",
                "https://abdenourtadjer33.github.io/dialog-shadcnui-emitter/r/use-drag-transform.json",
                "https://abdenourtadjer33.github.io/dialog-shadcnui-emitter/r/draggable-dialog.json"
            ],
            "files": [
                { "path": "registry/components/dialog-manager.tsx", "type": "registry:component" },
                { "path": "registry/lib/dialogs.ts", "type": "registry:lib" }
            ]
        }
    ]
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run registry:build && ls public/r/`
Expected: `dialog-manager.json  draggable-dialog.json  use-drag-transform.json`
Then: `node -e "const j=require('./public/r/dialog-manager.json'); console.log(j.files.map(f=>f.path)); console.log(j.registryDependencies)"`
Expected: both registry file paths and the three registryDependencies printed; each `files[].content` non-empty.

- [ ] **Step 3: Commit**

```bash
git add registry.json
git commit -m "feat: define shadcn registry items and build pipeline"
```

---

### Task 6: Vite demo playground

**Files:**
- Create: `vite.config.ts`, `demo/index.html`, `demo/main.tsx`, `demo/app.tsx`, `demo/styles.css`

**Interfaces:**
- Consumes: `openDialog`, `closeDialog` from `@/lib/dialogs`; `DialogManager` from `@/components/dialog-manager`; `Button` from `@/components/ui/button`.

- [ ] **Step 1: Create `vite.config.ts`** (repo root)

```ts
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    root: 'demo',
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { '@': path.resolve(import.meta.dirname, 'registry') },
    },
});
```

- [ ] **Step 2: Create `demo/index.html`**

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>dialog-shadcnui-emitter — demo</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/main.tsx"></script>
    </body>
</html>
```

- [ ] **Step 3: Create `demo/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
```

- [ ] **Step 4: Create `demo/styles.css`** (Tailwind v4 + shadcn zinc theme, light only)

```css
@import 'tailwindcss';
@source '../registry';

:root {
    --radius: 0.625rem;
    --background: oklch(1 0 0);
    --foreground: oklch(0.141 0.005 285.823);
    --primary: oklch(0.21 0.006 285.885);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.967 0.001 286.375);
    --secondary-foreground: oklch(0.21 0.006 285.885);
    --muted: oklch(0.967 0.001 286.375);
    --muted-foreground: oklch(0.552 0.016 285.938);
    --accent: oklch(0.967 0.001 286.375);
    --accent-foreground: oklch(0.21 0.006 285.885);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.92 0.004 286.32);
    --input: oklch(0.92 0.004 286.32);
    --ring: oklch(0.705 0.015 286.067);
}

@theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
    --radius-sm: calc(var(--radius) - 4px);
    --radius-md: calc(var(--radius) - 2px);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) + 4px);
}

body {
    @apply bg-background text-foreground antialiased;
}
```

- [ ] **Step 5: Create `demo/app.tsx`**

```tsx
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
```

- [ ] **Step 6: Typecheck + manual verification**

Run: `npm run typecheck` → exit 0.
Run: `npm run dev`, open the printed URL, and verify: each button opens the dialog; header-drag moves it smoothly and clamps at edges (except the overflow one); arrow keys move it when the header is focused; "Not draggable" doesn't drag; reopening is always centred; Escape/outside-click/X close it; `closeDialog()` closes after 2 s.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts demo/
git commit -m "feat: add Vite demo playground for manual drag testing"
```

---

### Task 7: GitHub Actions → GitHub Pages deploy

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run typecheck`, `npm run registry:build` (Tasks 1, 5); publishes `public/`.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy registry

on:
    push:
        branches: [main]
    workflow_dispatch:

permissions:
    contents: read
    pages: write
    id-token: write

concurrency:
    group: pages
    cancel-in-progress: true

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: 22
                  cache: npm
            - run: npm ci
            - run: npm run typecheck
            - run: npm run registry:build
            - uses: actions/upload-pages-artifact@v3
              with:
                  path: public
    deploy:
        needs: build
        runs-on: ubuntu-latest
        environment:
            name: github-pages
            url: ${{ steps.deployment.outputs.page_url }}
        steps:
            - id: deployment
              uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: build and deploy registry to GitHub Pages"
```

- [ ] **Step 3: One-time repo setting (manual, needs the user or gh CLI)**

Enable Pages with source "GitHub Actions": `gh api -X POST repos/AbdenourTadjer33/dialog-shadcnui-emitter/pages -f build_type=workflow` (or Settings → Pages → Source → GitHub Actions). If the API call returns 409, Pages is already configured — verify `build_type` is `workflow`.

---

### Task 8: README + license

**Files:**
- Rewrite: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Create `LICENSE`** (MIT)

```text
MIT License

Copyright (c) 2026 Abdennour Tadjer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Rewrite `README.md`**

````markdown
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
````

- [ ] **Step 3: Commit and push**

```bash
git add README.md LICENSE
git commit -m "docs: README with install instructions and API reference, MIT license"
git push origin main
```

- [ ] **Step 4: Post-push verification**

After the workflow finishes (`gh run watch`), verify the registry is live:
`curl -sf https://abdenourtadjer33.github.io/dialog-shadcnui-emitter/r/dialog-manager.json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(j.name, j.files.length+' files')})"`
Expected: `dialog-manager 2 files`. Final acceptance: run the install command from the README in a scratch shadcn project and confirm all files land and compile.
