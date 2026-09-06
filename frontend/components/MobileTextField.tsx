"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";

const query = "(width < 40rem)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;

interface MobileTextFieldProps {
  value: string;
  label: string;
  className: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/** Preserve single-line data while letting phone users read wrapped text. */
export default function MobileTextField({ value, label, className, onChange, onKeyDown, ...props }: MobileTextFieldProps) {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    const resize = () => {
      field.style.height = "0px";
      field.style.height = `${Math.min(field.scrollHeight + 2, 192)}px`;
    };
    resize();
    let width = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) {
        width = field.clientWidth;
        resize();
      }
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [isMobile, value]);

  if (!isMobile) {
    return <input {...props} aria-label={label} type="text" className={className} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} />;
  }

  return (
    <textarea
      {...props}
      ref={ref}
      aria-label={label}
      rows={1}
      className={`mobile-text-field ${className}`}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/[\r\n]+/g, " "))}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "Enter") event.preventDefault();
      }}
    />
  );
}
