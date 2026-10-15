
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';
import { Banner, Stat, useNav } from '@/components/ui';

export default function Dashboard() {
  const { go } = useNav();

  const [name, setName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setErrorMessage('Please log in again.');
        setLoading(false);
        return;
      }

      const [profileResult, tasksResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single(),

        supabase
          .from('tasks')
          .select(
            'id, title, description, status, priority, deadline, progress, created_at'
          )
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!active) return;

      if (profileResult.error || tasksResult.error) {
        console.error(
          'Dashboard loading error:',
          profileResult.error || tasksResult.error
        );

        setErrorMessage('Unable to load dashboard data.');
      } else {
        setName(profileResult.data?.full_name || 'Employee');
        setTasks(tasksResult.data || []);
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const currentMonth = todayString.slice(0, 7);

  const assignedCount = tasks.length;

  const dueToday = tasks.filter(
    (task) =>
      task.deadline &&
      task.deadline.slice(0, 10) === todayString &&
      task.status !== 'completed'
  ).length;

  const completedThisMonth = tasks.filter(
    (task) =>
      task.status === 'completed' &&
      task.created_at?.slice(0, 7) === currentMonth
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== 'completed'
  );

  const dueSoon = pendingTasks.filter((task) => {
    if (!task.deadline) return false;

    const deadline = new Date(task.deadline);
    const now = new Date();
    const threeDaysLater = new Date(now);

    threeDaysLater.setDate(now.getDate() + 3);

    return deadline >= now && deadline <= threeDaysLater;
  }).length;

  if (loading) {
    return (
      <>
        <Banner
          title="Employee Dashboard"
          sub="Loading your dashboard..."
        />
        <div className="card">
          <p>Loading your information...</p>
        </div>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Banner
          title="Employee Dashboard"
          sub="Your workspace"
        />
        <div className="card">
          <p style={{ color: 'red' }}>{errorMessage}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Banner
        title={`Hi, ${name.split(' ')[0]}`}
        sub={`You have ${dueSoon} task${
          dueSoon === 1 ? '' : 's'
        } due within the next 3 days.`}
        action={
          <button
            className="btn p"
            onClick={() => go('accomplish')}
          >
            <Icon n="check" />
            Submit accomplishment
          </button>
        }
      />

      <div className="g3">
        <Stat
          i={0}
          l="Assigned tasks"
          v={assignedCount}
          c="hl"
        />

        <Stat
          i={1}
          l="Due today"
          v={dueToday}
        />

        <Stat
          i={2}
          l="Completed this month"
          v={completedThisMonth}
        />
      </div>

      <div className="card mt">
        <div className="row sb">
          <h3>My assigned tasks</h3>

          <button
            className="btn lnk"
            onClick={() => go('tasks')}
          >
            View all
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="muted">
            No tasks have been assigned to you yet.
          </p>
        ) : (
          tasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="item"
              style={{ marginBottom: 10 }}
            >
              <div>
                <b>{task.title}</b>

                <div className="muted sm">
                  {task.deadline
                    ? `Due ${new Date(
                        task.deadline
                      ).toLocaleDateString()}`
                    : 'No deadline'}
                </div>
              </div>

              <span
                className={
                  task.priority === 'high'
                    ? 'chip pd'
                    : task.status === 'completed'
                    ? 'chip ok'
                    : 'chip'
                }
              >
                {task.status === 'completed'
                  ? 'Completed'
                  : task.priority}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="g2 mt">
        <button
          className="item"
          onClick={() => go('performance')}
        >
          <span>
            <b>Performance records</b>
            <br />
            <span className="muted sm">
              View your performance evaluations
            </span>
          </span>

          <Icon n="chart" />
        </button>

        <button
          className="item"
          onClick={() => go('notif')}
        >
          <span>
            <b>Notifications</b>
            <br />
            <span className="muted sm">
              View your reminders and updates
            </span>
          </span>

          <Icon n="bell" />
        </button>
      </div>
    </>
  );
}
