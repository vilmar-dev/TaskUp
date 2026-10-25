
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { Banner, Fld, useNav } from '@/components/ui';
import { createClient } from '@/lib/supabase';

const BUCKET = 'task-attachments';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

export default function Accomplish() {
  const { toast } = useApp();
  const { back } = useNav();
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get('id');

  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [accomplishment, setAccomplishment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
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

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (!active) return;

      if (fetchError) {
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

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed.');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File size must not exceed 5 MB.');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

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

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please log in again.');
      }

      // Verify that the task belongs to this employee.
      const { data: assignedTask, error: taskError } =
        await supabase
          .from('tasks')
          .select('id')
          .eq('id', taskId)
          .eq('assigned_to', user.id)
          .single();

      if (taskError || !assignedTask) {
        throw new Error(
          'This task is not assigned to your account.'
        );
      }

      // STEP 1: Upload attachment and save its record.
      if (selectedFile) {
        const extension = selectedFile.name
          .split('.')
          .pop()
          .toLowerCase();

        const uniqueName =
          `${crypto.randomUUID()}.${extension}`;

        // Matches the existing Storage policy:
        // task ID / employee ID / filename
        const storagePath =
          `${taskId}/${user.id}/${uniqueName}`;

        const { error: uploadError } =
          await supabase.storage
            .from(BUCKET)
            .upload(storagePath, selectedFile, {
              contentType: selectedFile.type,
              upsert: false,
            });

        if (uploadError) throw uploadError;

        // Record the uploaded file in the existing table.
        const { error: recordError } = await supabase
          .from('task_attachments')
          .insert({
            task_id: taskId,
            uploaded_by: user.id,
            file_name: selectedFile.name,
            storage_path: storagePath,
            file_type: selectedFile.type,
            file_size: selectedFile.size,
          });

        if (recordError) {
          // Roll back the uploaded file if recording fails.
          const { error: cleanupError } =
            await supabase.storage
              .from(BUCKET)
              .remove([storagePath]);

          if (cleanupError) {
            console.error(
              'Attachment rollback failed:',
              cleanupError
            );
          }

          throw recordError;
        }
      }

      // STEP 2: Submit accomplishment for review.
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
      console.error(
        'Submit accomplishment error:',
        submitError
      );

      alert(
        submitError.message ||
          'Something went wrong while submitting.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Banner
        back
        title="Submit accomplishment"
        sub="Share a summary and upload supporting proof for supervisor review."
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
                style={{
                  marginTop: 8,
                  padding: 20,
                  textAlign: 'center',
                  opacity: 1,
                }}
              >
                <p style={{ marginBottom: 12 }}>
                  Select a supporting file
                </p>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  disabled={saving}
                  style={{ width: '100%' }}
                />

                <p
                  className="muted"
                  style={{
                    fontSize: 12,
                    marginTop: 10,
                  }}
                >
                  Accepted: JPG, PNG, PDF (Max 5 MB)
                </p>
              </div>

              {selectedFile && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(0, 150, 100, 0.08)',
                  }}
                >
                  <p style={{ fontSize: 13 }}>
                    Selected: {selectedFile.name}
                  </p>

                  <p
                    className="muted"
                    style={{ fontSize: 12 }}
                  >
                    Size:{' '}
                    {(
                      selectedFile.size /
                      1024 /
                      1024
                    ).toFixed(2)}{' '}
                    MB
                  </p>
                </div>
              )}
            </div>

            <Fld label="Date completed">
              <input
                className="in"
                type="date"
                value={new Date().toLocaleDateString('en-CA')}
                disabled
              />

              <p
                className="muted"
                style={{ fontSize: 12 }}
              >
                Submission time is recorded automatically.
              </p>
            </Fld>

            <button
              className="btn p full"
              type="submit"
              disabled={saving || tasks.length === 0}
            >
              {saving
                ? 'Uploading / Submitting...'
                : 'Submit for review'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
