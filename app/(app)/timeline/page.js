
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Banner } from '@/components/ui';

export default function TimelinePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function loadTimeline() {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, deadline, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setTasks(data || []);
      }

      setLoading(false);
    }

    loadTimeline();
  }, []);

  return (
    <>
      <Banner
        title="Timeline"
        sub="Track team tasks, deadlines, and progress."
      />

      <div className="card">
        {loading ? (
          <p>Loading timeline...</p>
        ) : error ? (
          <p style={{ color: 'crimson' }}>{error}</p>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <h3>No tasks yet</h3>
            <p className="muted">
              Tasks will appear here once they are created.
            </p>
          </div>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td data-l="Task">{task.title}</td>
                    <td data-l="Priority">{task.priority}</td>
                    <td data-l="Status">
                      <span className="chip">{task.status}</span>
                    </td>
                    <td data-l="Deadline">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleString()
                        : 'No deadline'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
