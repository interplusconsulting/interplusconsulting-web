'use client';

import { useCallback, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

type Validators<K extends string> = Record<K, (value: string, all: Record<K, string>) => string>;

const TYPING_PAUSE_MS = 700;

/**
 * Field values + errors. A field is checked when the user leaves it (blur) or stops typing for a moment,
 * and from then on it is re-checked on every change so the message clears as soon as it is fixed.
 */
export function useValidatedForm<K extends string>(initial: Record<K, string>, validators: Validators<K>) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});
  const timers = useRef<Partial<Record<K, number>>>({});

  useEffect(() => () => { Object.values(timers.current).forEach(id => window.clearTimeout(id as number)); }, []);

  const errorFor = useCallback((name: K, current = values) => validators[name](current[name], current), [validators, values]);

  const touch = useCallback((name: K) => {
    window.clearTimeout(timers.current[name]);
    setTouched(state => (state[name] ? state : { ...state, [name]: true }));
  }, []);

  const setValue = useCallback((name: K, value: string) => {
    setValues(state => ({ ...state, [name]: value }));
    window.clearTimeout(timers.current[name]);
    timers.current[name] = window.setTimeout(() => touch(name), TYPING_PAUSE_MS);
  }, [touch]);

  /** Marks every field as checked; returns the first invalid field name, or null when the form is valid. */
  const validateAll = useCallback((): K | null => {
    const names = Object.keys(validators) as K[];
    setTouched(Object.fromEntries(names.map(name => [name, true])) as Record<K, boolean>);
    return names.find(name => errorFor(name)) ?? null;
  }, [validators, errorFor]);

  const fieldProps = (name: K) => {
    const error = touched[name] ? errorFor(name) : '';
    const valid = Boolean(touched[name]) && !error && values[name] !== '';
    return { name, value: values[name], error, valid, onValue: (value: string) => setValue(name, value), onBlur: () => touch(name) };
  };

  return { values, setValue, fieldProps, validateAll, reset: () => { setValues(initial); setTouched({}); } };
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  error: string;
  valid: boolean;
  hint?: ReactNode;
  onValue: (value: string) => void;
  onBlur: () => void;
  transform?: (value: string) => string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur' | 'name'>;

export function ValidatedField({ label, name, value, error, valid, hint, onValue, onBlur, transform, ...input }: FieldProps) {
  const id = `field-${name}`;
  const describedBy = [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;
  return <div className={`ip-field ${error ? 'has-error' : ''} ${valid ? 'is-valid' : ''}`}>
    <label htmlFor={id}>{label}</label>
    <div className="ip-field-control">
      <input
        {...input}
        id={id}
        name={name}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={event => onValue(transform ? transform(event.target.value) : event.target.value)}
        onBlur={onBlur}
      />
      {valid && <span className="ip-field-ok" aria-hidden="true">✓</span>}
    </div>
    {hint && <div id={`${id}-hint`} className="ip-field-hint">{hint}</div>}
    {error && <p id={`${id}-error`} className="ip-field-error" role="alert">{error}</p>}
  </div>;
}
