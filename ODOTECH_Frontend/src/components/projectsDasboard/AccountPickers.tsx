import { useMemo, useRef } from 'react';

import type { Account } from '../../interface/type';

type AccountTokenFn = (a: Account) => string;

export function AccountIdPicker({
  valueId,
  accountsById,
  options,
  placeholder,
  onChangeId,
  datalistId,
  className,
  tokenForAccount,
}: {
  valueId: number | null;
  accountsById: Map<number, Account>;
  options: Account[];
  placeholder: string;
  onChangeId: (next: number | null) => void;
  datalistId: string;
  className: string;
  tokenForAccount: AccountTokenFn;
}) {
  const initialValue = useMemo(() => {
    if (!valueId) return '';
    const a = accountsById.get(valueId);
    return a ? tokenForAccount(a) : String(valueId);
  }, [accountsById, tokenForAccount, valueId]);

  const lastValueRef = useRef(initialValue);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChangeId(null);
      return;
    }

    if (/^\d+$/.test(trimmed)) {
      onChangeId(Number(trimmed));
      return;
    }

    const match = trimmed.match(/#(\d+)$/);
    if (match) {
      onChangeId(Number(match[1]));
      return;
    }

    const found = options.find((a) => {
      const u = a.username?.trim() || '';
      const n = a.name?.trim() || '';
      return u.toLowerCase() === trimmed.toLowerCase() || n.toLowerCase() === trimmed.toLowerCase();
    });
    if (found) onChangeId(found.id);
  };

  return (
    <>
      <input
        type="text"
        list={datalistId}
        key={`${valueId ?? 'none'}:${initialValue}`}
        defaultValue={initialValue}
        onFocus={(e) => e.currentTarget.select()}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          lastValueRef.current = e.target.value;
          commit(e.target.value);
        }}
        onBlur={() => commit(lastValueRef.current)}
        className={className}
        placeholder={placeholder}
      />
      <datalist id={datalistId}>
        {options.map((a) => (
          <option key={a.id} value={tokenForAccount(a)} />
        ))}
      </datalist>
    </>
  );
}

export function AccountTextPicker({
  value,
  options,
  placeholder,
  datalistId,
  onChange,
  className,
}: {
  value: string;
  options: Account[];
  placeholder: string;
  datalistId: string;
  onChange: (next: string) => void;
  className: string;
}) {
  return (
    <>
      <input
        type="text"
        list={datalistId}
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        placeholder={placeholder}
      />
      <datalist id={datalistId}>
        {options.map((a) => (
          <option key={a.id} value={a.username || a.name} />
        ))}
      </datalist>
    </>
  );
}
