
'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { Banner, useNav } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function Tasks() {
  const { role } = useApp();
  const { go } = useNav();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('board');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(
          'id, title, description, deadline, priority, status, progress, assigned_to, created_at'
        )
        .order('deadline', {
          ascending: true,
          nullsFirst: false,
        });

      if (!active) return;

      if (fetchError) {
        console.error('Load tasks error:', fetchError);
        setError(fetchError.message);
      } else {
        setTasks(data || []);
        setError('');
      }

      setLoading(false);
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const col = (priority) =>
    filteredTasks.filter((task) => task.priority === priority);

  function formatDeadline(deadline) {
    if (!deadline) return 'No deadline';

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) {
      return 'No deadline';
    }

    return `Due ${date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}`;
  }

  function TaskItem({ task }) {
    const priority = task.priority || 'medium';
    const progress = task.progress || 0;

    const priorityColors = {
      high: '#e73557',
      medium: '#d18400',
      low: '#3478f6',
    };

    const color = priorityColors[priority] || '#7c3aed';

    return (
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 12,
          borderLeft: `4px solid ${color}`,
          cursor: 'pointer',
        }}
        onClick={() => go(`taskdetail?id=${task.id}`)}
      >
        <h4 style={{ marginBottom: 10 }}>
          {task.title}
        </h4>

        <p className="muted" style={{ marginBottom: 12 }}>
          {formatDeadline(task.deadline)}
        </p>

        <div
          style={{
            width: '100%',
            height: 7,
            background: '#e8def8',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #7135f5, #cc25d0)',
              borderRadius: 10,
            }}
          />
        </div>

        <div
          className="row"
          style={{ justifyContent: 'space-between' }}
        >
          <span
            className={`chip ${
              priority === 'high'
                ? 'bad'
                : priority === 'low'
                ? 'ok'
                : ''
            }`}
          >
            {priority.charAt(0).toUpperCase() +
              priority.slice(1)}
          </span>

          <span className="muted">
            {progress}% done
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Banner
        title="Task board"
        sub="Track team tasks, deadlines, and progress."
        action={
          role === 'supervisor' ? (
            <button
              className="btn p"
              onClick={() => go('taskcreate')}
            >
              <Icon n="plus" />
              New task
            </button>
          ) : null
        }
      />

      <div
        className="row wrap"
        style={{ marginBottom: 18 }}
      >
        <select
          className="btn"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Filter: All tasks</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>

        <button
          className={`btn ${view === 'list' ? 'p' : ''}`}
          onClick={() => setView('list')}
        >
          List
        </button>

        <button
          className={`btn ${view === 'board' ? 'p' : ''}`}
          onClick={() => setView('board')}
        >
          Board
        </button>
      </div>

      {loading ? (
        <div className="card">
          <p>Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="card">
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '45px 20px',
          }}
        >
          <h3>No tasks found</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            Tasks will appear here when available.
          </p>
        </div>
      ) : view === 'board' ? (
        <div className="g3">
          {[
            ['high', 'High priority'],
            ['medium', 'Medium priority'],
            ['low', 'Low priority'],
          ].map(([priority, label]) => (
            <div className="col" key={priority}>
              <h3>
                {label}{' '}
                <span className="muted">
                  {col(priority).length}
                </span>
              </h3>

              {col(priority).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr className="hd">
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      go(`taskdetail?id=${task.id}`)
                    }
                  >
                    <td data-l="Task">
                      <strong>{task.title}</strong>
                    </td>

                    <td data-l="Priority">
                      {task.priority}
                    </td>

                    <td data-l="Deadline">
                      {formatDeadline(task.deadline)}
                    </td>

                    <td data-l="Status">
                      {task.status?.replaceAll('_', ' ')}
                    </td>

                    <td data-l="Progress">
                      {task.progress || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
