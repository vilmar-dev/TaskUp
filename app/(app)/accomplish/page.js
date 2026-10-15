
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { Banner, Fld, useNav } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function Accomplish() {
  const { toast } = useApp();
  const { back } = useNav();
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get('id');

  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [accomplishment, setAccomplishment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setError('Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Logged-in employee ID:', user.id);

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (!active) return;

      if (fetchError) {
        console.error('Load tasks error:', fetchError);
        setError(fetchError.message);
      } else {
        const availableTasks = data || [];
        setTasks(availableTasks);

        const selectedExists = availableTasks.some(
          (task) => task.id === selectedTaskId
        );

        setTaskId(
          selectedExists
            ? selectedTaskId
            : selectedTaskId
              ? ''
              : availableTasks[0]?.id || ''
        );
      }

      setLoading(false);
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [selectedTaskId]);

  async function submitAccomplishment(e) {
    e.preventDefault();

    if (saving) return;

    if (!taskId) {
      alert('Please select a task.');
      return;
    }

    if (!accomplishment.trim()) {
      alert('Please enter your accomplishment.');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { error: submitError } = await supabase.rpc(
        'submit_work',
        {
          target_task_id: taskId,
          accomplishment_text: accomplishment.trim(),
        }
      );

      if (submitError) throw submitError;

      toast('Accomplishment submitted for supervisor review');
      back();
    } catch (submitError) {
      console.error('Submit accomplishment error:', submitError);
      alert(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Banner
        back
        title="Submit accomplishment"
        sub="Share a short summary so your supervisor can evaluate your work."
      />

      <div className="card" style={{ maxWidth: 640 }}>
        {loading ? (
          <p>Loading assigned tasks...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <form onSubmit={submitAccomplishment}>
            <Fld label="Task">
              <select
                className="in"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                required
              >
                <option value="">Select a task</option>

                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </Fld>

            {tasks.length === 0 && (
              <p className="muted">
                No assigned tasks found.
              </p>
            )}

            <Fld label="What did you accomplish?">
              <textarea
                className="in"
                placeholder="Summarize what was done"
                value={accomplishment}
                onChange={(e) =>
                  setAccomplishment(e.target.value)
                }
                rows={5}
                required
              />
            </Fld>

            <div
              className="f"
              style={{
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              Proof or output

              <div
                className="drop"
                style={{ marginTop: 6, opacity: 0.6 }}
              >
                <Icon n="up" />
                <p>File uploads will be available later.</p>
              </div>
            </div>

            <Fld label="Date completed">
              <input
                className="in"
                type="date"
                value={new Date().toLocaleDateString('en-CA')}
                disabled
              />
              <p className="muted" style={{ fontSize: 12 }}>
                Submission time is recorded automatically.
              </p>
            </Fld>

            <button
              className="btn p full"
              type="submit"
              disabled={saving || tasks.length === 0}
            >
              {saving
                ? 'Submitting...'
                : 'Submit for review'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
