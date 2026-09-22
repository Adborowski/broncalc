import { useEffect, useRef, useState } from "react";

/**
 * "Clear all" with an inline "are you sure?" step. Cancel is focused when
 * the question appears, so a stray Enter or double-click doesn't wipe
 * anything.
 */
export function ClearAll({ onClear }: { onClear: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  if (!confirming) {
    return (
      <button type="button" className="btn-quiet" onClick={() => setConfirming(true)}>
        Clear all
      </button>
    );
  }

  return (
    <div
      className="clear-confirm"
      role="alertdialog"
      aria-label="Clear all inputs?"
      onKeyDown={(e) => e.key === "Escape" && setConfirming(false)}
    >
      <span>Clear all inputs?</span>
      <button
        type="button"
        className="btn-danger"
        onClick={() => {
          onClear();
          setConfirming(false);
        }}
      >
        Yes, clear
      </button>
      <button type="button" className="btn-quiet" ref={cancelRef} onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </div>
  );
}
