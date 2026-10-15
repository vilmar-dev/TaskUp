'use client';

import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { useApp } from './Providers';
import { PL } from '@/lib/data';

export function useNav() {
  const router = useRouter();
  const { role } = useApp();
  const go = (s) => router.push('/' + s);
  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(role === 'supervisor' ? '/supdash' : '/dashboard');
  };
  return { go, back };
}

export function BackButton() {
  const { back } = useNav();
  return (
    <button className="btn lnk" style={{ marginBottom: 14 }} onClick={back}>
      <Icon n="back" />
      Back
    </button>
  );
}

export function Banner({ title, sub, action, back }) {
  return (
    <div className="banner">
      {back && <BackButton />}
      <div className="head">
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export function Fld({ label, children }) {
  return (
    <label className="f">
      {label}
      {children}
    </label>
  );
}

export function Stat({ i = 0, l, v, c = '' }) {
  const k = /Employees/.test(l)
    ? 'users'
    : /Overdue|Due/.test(l)
    ? 'bell'
    : /omplet|Pending/.test(l)
    ? 'check'
    : /rate/.test(l)
    ? 'chart'
    : 'list';
  return (
    <div className={`card stat ${c}`}>
      <span className={`bub b${i % 3}`}>
        <Icon n={k} />
      </span>
      <div>
        <b>{v}</b>
        <span className="muted sm">{l}</span>
      </div>
    </div>
  );
}

export function TaskCard({ t }) {
  const { go } = useNav();
  return (
    <div
      className={`tc ${t.p}`}
      tabIndex={0}
      role="button"
      onClick={() => go('taskdetail')}
      onKeyDown={(e) => e.key === 'Enter' && go('taskdetail')}
    >
      <b>{t.t}</b>
      <span className="muted sm">{t.d}</span>
      <div className="bar">
        <i style={{ width: t.n + '%' }} />
      </div>
      <div className="row sb">
        <span className={`chip ${t.p}`}>{PL[t.p]}</span>
        <span className="muted sm">{t.n}% done</span>
      </div>
    </div>
  );
}

export function TaskRow({ t }) {
  const { go } = useNav();
  return (
    <button className="item" onClick={() => go('taskdetail')}>
      <span>
        <b>{t.t}</b>
        <br />
        <span className="muted sm">{t.d}</span>
      </span>
      <span className={`chip ${t.p}`}>{PL[t.p]}</span>
    </button>
  );
}
