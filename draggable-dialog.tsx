"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export const DraggableDialog = DialogPrimitive.Root;
export const DraggableDialogTrigger = DialogPrimitive.Trigger;
export const DraggableDialogClose = DialogPrimitive.Close;
export const DraggableDialogTitle = DialogPrimitive.Title;
export const DraggableDialogDescription = DialogPrimitive.Description;

export function DraggableDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        // NOTE: deliberately no backdrop-blur — it repaints the whole screen every drag frame
        className,
      )}
      {...props}
    />
  );
}

type DraggableDialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & {
  /** The transform-only drag layer ref, from useDragTransform. */
  dragLayerRef?: React.Ref<HTMLDivElement>;
  /** Applied to the drag layer — put your max-width / sizing classes here. */
  containerClassName?: string;
  showCloseButton?: boolean;
  closeLabel?: string;
};

export function DraggableDialogContent({
  className,
  containerClassName,
  dragLayerRef,
  showCloseButton = true,
  closeLabel = "Fermer",
  children,
  ...props
}: DraggableDialogContentProps) {
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal">
      <DraggableDialogOverlay />

      {/* Centering container. Transparent to pointer events so the overlay
                still receives outside-clicks for Radix's dismiss behaviour. */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* DRAG LAYER — owns `transform` and nothing else. Its own compositor
                    layer, so moving it never repaints the content beneath. */}
        <div
          ref={dragLayerRef}
          data-slot="dialog-drag-layer"
          className={cn(
            "pointer-events-auto w-full will-change-transform [backface-visibility:hidden] [transition:none]",
            "sm:max-w-lg",
            containerClassName,
          )}
        >
          <DialogPrimitive.Content
            data-slot="dialog-content"
            className={cn(
              "relative flex max-h-[calc(100vh-4rem)] w-full flex-col overflow-hidden rounded-lg border bg-background shadow-lg",
              // enter/exit animations are safe here: this element has no transform of its own
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              className,
            )}
            {...props}
          >
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-no-drag
                className="absolute top-3 right-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
              >
                <XIcon className="size-4" />
                <span className="sr-only">{closeLabel}</span>
              </DialogPrimitive.Close>
            )}
          </DialogPrimitive.Content>
        </div>
      </div>
    </DialogPrimitive.Portal>
  );
}

/** The drag handle. Attach the hook's `dragHandleRef` to it. */
export function DraggableDialogHeader({
  className,
  isDraggable = true,
  ...props
}: React.ComponentProps<"div"> & { isDraggable?: boolean }) {
  return (
    <div
      data-slot="dialog-header"
      tabIndex={isDraggable ? 0 : undefined}
      className={cn(
        "shrink-0 border-b bg-muted px-6 py-4 pr-12",
        isDraggable &&
          "cursor-grab touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[dragging]:cursor-grabbing",
        className,
      )}
      {...props}
    />
  );
}

export function DraggableDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-4", className)}
      {...props}
    />
  );
}

export function DraggableDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
