'use client';

import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { Banner, useNav } from '@/components/ui';

export default function Notifications() {
  const { role } = useApp();
  const { go } = useNav();
  const emp = role === 'employee';
  const items = [
    ['bell', 'New deadline reminder: Client report', 'taskdetail'],
    [
      emp ? 'chart' : 'check',
      emp ? 'Your accomplishment was evaluated' : 'Weekly accomplishment summary is ready',
      emp ? 'performance' : 'reports',
    ],
    ['users', 'Slack: a teammate commented on a task', 'taskdetail'],
  ];
  return (
    <>
      <Banner title="Notifications" sub="Reminders and updates from email, Slack, and Teams." />
      {items.map((n) => (
        <button key={n[1]} className="item" onClick={() => go(n[2])}>
          <span className="row">
            <Icon n={n[0]} />
            {n[1]}
          </span>
        </button>
      ))}
    </>
  );
}
