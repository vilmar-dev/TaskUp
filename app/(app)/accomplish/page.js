
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
  const [rejectedSubmissions, setRejectedSubmissions] = useState({});
  const [latestSubmissionStatus, setLatestSubmissionStatus] = useState({});

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

        // Load the employee's submissions, newest first.
        const { data: employeeSubmissions, error: submissionsError } =
          await supabase
            .from('work_submissions')
            .select('id, task_id, accomplishment, submitted_at')
            .eq('employee_id', user.id)
            .order('submitted_at', { ascending: false });

        if (!active) return;

        if (submissionsError) {
          setError(submissionsError.message);
          setLoading(false);
          return;
        }

        // Keep only the latest submission for each task.
        const latestByTask = {};

        for (const submission of employeeSubmissions || []) {
          if (!latestByTask[submission.task_id]) {
            latestByTask[submission.task_id] = submission;
          }
        }

        const latestIds = Object.values(latestByTask).map(
          (item) => item.id
        );

        let evaluationMap = {};

        if (latestIds.length > 0) {
          const { data: evaluations, error: evaluationsError } =
            await supabase
              .from('evaluations')
              .select('submission_id, approval_status, feedback')
              .in('submission_id', latestIds);

          if (!active) return;

          if (evaluationsError) {
            setError(evaluationsError.message);
            setLoading(false);
            return;
          }

          evaluationMap = Object.fromEntries(
            (evaluations || []).map((item) => [
              item.submission_id,
              item,
            ])
          );
        }

        const rejectedByTask = {};
        const statusesByTask = {};

        for (const [id, submission] of Object.entries(latestByTask)) {
          const evaluation = evaluationMap[submission.id];
          const status =
            evaluation?.approval_status || 'awaiting_evaluation';

          statusesByTask[id] = status;

          if (status === 'rejected') {
            rejectedByTask[id] = {
              accomplishment: submission.accomplishment,
              feedback: evaluation?.feedback || '',
            };
          }
        }

        if (!active) return;

        setRejectedSubmissions(rejectedByTask);
        setLatestSubmissionStatus(statusesByTask);
      }

      setLoading(false);
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [selectedTaskId]);

  // Load the previous accomplishment when revision is required.
  useEffect(() => {
    setAccomplishment(
      rejectedSubmissions[taskId]?.accomplishment || ''
    );
    setSelectedFile(null);
  }, [taskId, rejectedSubmissions]);

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

    const currentStatus = latestSubmissionStatus[taskId];

    if (currentStatus && currentStatus !== 'rejected') {
      alert(
        'This task already has a submission awaiting review or approved.'
      );
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

      // Verify the task belongs to the logged-in employee.
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

      // Preserve existing attachment upload functionality.
      if (selectedFile) {
        const extension = selectedFile.name
          .split('.')
          .pop()
          .toLowerCase();

        const uniqueName =
          `${crypto.randomUUID()}.${extension}`;

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

      // Create a new submission, preserving rejected history.
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

  const revision = rejectedSubmissions[taskId];
  const currentStatus = latestSubmissionStatus[taskId];
  const submissionBlocked =
    Boolean(currentStatus) && currentStatus !== 'rejected';

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

            {revision && (
              <div
                role="status"
                style={{
                  padding: 16,
                  marginBottom: 18,
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  borderRadius: 8,
                  color: '#7f1d1d',
                }}
              >
                <strong>Revision requested</strong>

                <p style={{ marginTop: 8 }}>
                  <strong>Supervisor feedback:</strong>{' '}
                  {revision.feedback || 'No feedback provided.'}
                </p>

                <p style={{ marginTop: 8 }}>
                  Your previous accomplishment is loaded below.
                  Edit it and submit the revised version for review.
                </p>
              </div>
            )}

            {submissionBlocked && (
              <p className="muted" role="status">
                This task already has a submission (
                {currentStatus === 'approved'
                  ? 'approved'
                  : 'awaiting supervisor review'}
                ). You cannot submit another version from this page.
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
              disabled={
                saving ||
                tasks.length === 0 ||
                submissionBlocked
              }
            >
              {saving
                ? 'Uploading / Submitting...'
                : revision
                  ? 'Resubmit revised accomplishment'
                  : 'Submit for review'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
