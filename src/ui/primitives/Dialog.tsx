import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({
  open,
  onClose,
  titleId,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) {
      ref.current?.showModal();
      ref.current?.querySelector<HTMLInputElement>("input:not([disabled])")?.focus();
    } else if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close();
      }}
    >
      {children}
    </dialog>
  );
}
