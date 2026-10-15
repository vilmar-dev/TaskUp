
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useApp } from '@/components/Providers';
import { Banner, Fld, useNav } from '@/components/ui';

const supabase = createClient();

export default function TaskCreate() {
  const { toast } = useApp();
  const { go, back } = useNav();

  // NEW: Detect whether we are editing a task
  const searchParams = useSearchParams();
  const taskId = searchParams.get('id');
  const isEditing = Boolean(taskId);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingTask, setLoadingTask] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    assigned_to: '',
  });

  // Load approved employees
  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'employee')
        .eq('approval_status', 'approved')
        .order('full_name');

      if (!active) return;

      if (error) {
        console.error('Load employees error:', error);
        setLoadError(error.message);
      } else {
        setEmployees(data || []);
      }

      setLoadingEmployees(false);
    }

    loadEmployees();

    return () => {
      active = false;
    };
  }, []);

  // NEW: Load existing task when editing
  useEffect(() => {
    let active = true;

    async function loadTask() {
      if (!taskId) {
        setLoadingTask(false);
        return;
      }

      setLoadingTask(true);
      setLoadError('');

      const { data, error } = await supabase
        .from('tasks')
        .select(
          'id, title, description, deadline, priority, assigned_to'
        )
        .eq('id', taskId)
        .single();

      if (!active) return;

      if (error) {
        console.error('Load task error:', error);
        setLoadError(error.message);
      } else {
        setForm({
          title: data.title || '',
          description: data.description || '',
          deadline: data.deadline
            ? data.deadline.slice(0, 10)
            : '',
          priority: data.priority || 'medium',
          assigned_to: data.assigned_to || '',
        });
      }

      setLoadingTask(false);
    }

    loadTask();

    return () => {
      active = false;
    };
  }, [taskId]);

  // UPDATED: Handles both creating and editing
  async function saveTask(e) {
    e.preventDefault();

    if (saving || loadingTask || loadError) return;

    if (!form.title.trim()) {
      alert('Please enter a task title.');
      return;
    }

    if (!form.assigned_to) {
      alert('Please select an employee.');
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please log in again.');
      }

      const taskData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        deadline: form.deadline
          ? new Date(
              `${form.deadline}T23:59:59`
            ).toISOString()
          : null,
        priority: form.priority,
        assigned_to: form.assigned_to,
        updated_at: new Date().toISOString(),
      };

      let error;

      if (isEditing) {
        // NEW: Update existing task
        const result = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', taskId)
          .select('id')
          .single();

        error = result.error;
      } else {
        // Existing: Create new task
        const result = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            created_by: user.id,
            status: 'pending',
            progress: 0,
          });

        error = result.error;
      }

      if (error) throw error;

      toast(
        isEditing
          ? 'Task updated successfully'
          : 'Task created successfully'
      );

      if (isEditing) {
        go(`taskdetail?id=${taskId}`);
      } else {
        go('tasks');
      }
    } catch (error) {
      console.error('Save task error:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Banner
        back
        title={isEditing ? 'Edit task' : 'Create task'}
        sub={
          isEditing
            ? 'Update the task details and save your changes.'
            : 'Add the details, then assign it to a team member.'
        }
      />

      <div className="card" style={{ maxWidth: 640 }}>
        {loadingTask ? (
          <p>Loading task information...</p>
        ) : loadError ? (
          <p style={{ color: 'red' }}>
            {loadError}
          </p>
        ) : (
          <form onSubmit={saveTask}>
            <Fld label="Task title">
              <input
                className="in"
                type="text"
                placeholder="e.g. Prepare weekly report"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                required
              />
            </Fld>

            <Fld label="Description">
              <textarea
                className="in"
                placeholder="Add details or notes"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
            </Fld>

            <div className="g2" style={{ gap: 14 }}>
              <Fld label="Deadline">
                <input
                  className="in"
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deadline: e.target.value,
                    })
                  }
                />
              </Fld>

              <Fld label="Priority">
                <select
                  className="in"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value,
                    })
                  }
                >
                  <option value="medium">
                    Medium
                  </option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </Fld>
            </div>

            <Fld label="Assign to">
              <select
                className="in"
                value={form.assigned_to}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assigned_to: e.target.value,
                  })
                }
                disabled={loadingEmployees}
                required
              >
                <option value="">
                  {loadingEmployees
                    ? 'Loading employees...'
                    : 'Select an employee'}
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.full_name}
                  </option>
                ))}
              </select>
            </Fld>

            {!loadingEmployees &&
              employees.length === 0 && (
                <p className="muted">
                  No approved employees found.
                  Approve an employee account
                  before assigning a task.
                </p>
              )}

            <div className="row">
              <button
                className="btn p"
                type="submit"
                disabled={
                  saving ||
                  loadingEmployees ||
                  employees.length === 0
                }
              >
                {saving
                  ? 'Saving...'
                  : isEditing
                  ? 'Save changes'
                  : 'Save task'}
              </button>

              <button
                className="btn"
                type="button"
                onClick={back}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
