
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { Banner, useNav } from '@/components/ui';
import { createClient } from '@/lib/supabase';

const BUCKET = 'task-attachments';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const statusLabels = {
  pending: 'Not started',
  in_progress: 'In progress',
  completed: 'Done',
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TaskDetail() {
  const { role, toast } = useApp();
  const { go } = useNav();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('id');
  const fileInputRef = useRef(null);

  const [task, setTask] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);

  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTask() {
      setLoading(true);
      setTask(null);

      if (!taskId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (cancelled) return;

      if (error) {
        console.error('Load task error:', error);
        setLoading(false);
        return;
      }

      setTask(data);
      setStatus(data.status);
      setProgress(data.progress ?? 0);

      const { data: employee } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.assigned_to)
        .maybeSingle();

      if (cancelled) return;

      setEmployeeName(employee?.full_name || 'Employee');
      setLoading(false);
    }

    loadTask();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttachments() {
      setAttachments([]);
      setAttachmentError('');
      setAttachmentsLoading(true);

      if (!taskId || !task) {
        setAttachmentsLoading(false);
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error('Load attachments error:', error);
        setAttachmentError(error.message);
      } else {
        setAttachments(data || []);
      }

      setAttachmentsLoading(false);
    }

    loadAttachments();

    return () => {
      cancelled = true;
    };
  }, [taskId, task?.id]);

  async function refreshAttachments() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setAttachments(data || []);
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];

    if (!file || !taskId || uploading) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setAttachmentError('');

    if (file.size === 0) {
      setAttachmentError('Cannot upload an empty file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAttachmentError('File must not exceed 5 MB.');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachmentError(
        'Only PDF, JPG, PNG, Word, and Excel files are allowed.'
      );
      return;
    }

    setUploading(true);

    const supabase = createClient();
    let storagePath = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please sign in before uploading a file.');
      }

      const extension =
        file.name.split('.').pop()?.toLowerCase() || 'file';

      const uniqueName = `${crypto.randomUUID()}.${extension}`;

      storagePath = `${taskId}/${user.id}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: recordError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          uploaded_by: user.id,
          file_name: file.name,
          storage_path: storagePath,
          file_type: file.type,
          file_size: file.size,
        });

      if (recordError) {
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET)
          .remove([storagePath]);

        if (cleanupError) {
          console.error(
            'Upload cleanup requires attention:',
            cleanupError
          );
        }

        throw recordError;
      }

      await refreshAttachments();
      toast('Attachment uploaded successfully');
    } catch (error) {
      console.error('Attachment upload error:', error);
      setAttachmentError(error.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  // UPDATED DOWNLOAD FUNCTION
  async function downloadFile(attachment) {
    if (downloadingId) return;

    setDownloadingId(attachment.id);
    setAttachmentError('');

    try {
      const supabase = createClient();

      const filePath = attachment.storage_path;

      if (!filePath) {
        throw new Error('This attachment has no saved file path.');
      }

      // First try downloading directly from the private bucket.
      let { data, error } = await supabase.storage
        .from(BUCKET)
        .download(filePath);

      if (error) {
        console.warn('Direct download failed:', {
          path: filePath,
          statusCode: error.statusCode,
          message: error.message,
        });

        // Fallback: request a temporary signed URL.
        // The bucket remains private and its SELECT policy applies.
        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(filePath, 60);

        if (signedError) {
          console.error('Signed URL error:', {
            path: filePath,
            statusCode: signedError.statusCode,
            message: signedError.message,
          });

          throw new Error(
            `Unable to access file: ${signedError.message}`
          );
        }

        if (!signedData?.signedUrl) {
          throw new Error('Supabase did not return a download URL.');
        }

        const response = await fetch(signedData.signedUrl);

        if (!response.ok) {
          throw new Error(
            `File download failed (HTTP ${response.status}).`
          );
        }

        data = await response.blob();
      }

      if (!data) {
        throw new Error('No file data was returned.');
      }

      const objectUrl = URL.createObjectURL(data);
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = attachment.file_name || 'attachment';
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);

      toast('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      setAttachmentError(
        error.message || 'Unable to download this file.'
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function saveProgress() {
    if (!taskId || saving) return;

    setSaving(true);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      'update_task_progress',
      {
        target_task_id: taskId,
        new_progress: Number(progress),
        new_status: status,
      }
    );

    if (error) {
      console.error('Save progress error:', error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setTask((previous) => ({
      ...previous,
      status,
      progress: Number(progress),
    }));

    toast('Task progress saved successfully');
    setSaving(false);
  }

  if (loading) {
    return (
      <>
        <Banner title="Task details" />
        <div className="card">Loading task...</div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Banner back title="Task details" />
        <div className="card">
          {taskId
            ? 'Task not found or you do not have permission to view it.'
            : 'No task selected. Open a task from All tasks.'}
        </div>
      </>
    );
  }

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No deadline';

  return (
    <>
      <Banner
        back
        title={task.title}
        sub={`Assigned to ${employeeName}. Deadline ${deadline}.`}
        action={
          <span
            className={
              task.priority === 'high'
                ? 'chip hi'
                : task.priority === 'low'
                ? 'chip ok'
                : 'chip'
            }
          >
            {task.priority} priority
          </span>
        }
      />

      <div className="g2 g21">
        <div>
          <div className="card">
            <h3>Description</h3>

            <p className="muted" style={{ margin: 0 }}>
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div className="card mt">
            <h3>Attachments</h3>

            <p className="muted">
              Employees and supervisors can exchange files
              related to this task.
            </p>

            <div
              className="drop"
              style={{
                padding: 22,
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 12 }}>
                Upload PDF, JPG, PNG, Word, or Excel files.
                <br />
                Maximum 5 MB per file.
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={uploadFile}
                disabled={uploading}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="btn p"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading
                  ? 'Uploading...'
                  : 'Choose file to upload'}
              </button>
            </div>

            {attachmentError && (
              <p
                role="alert"
                style={{
                  color: '#dc2626',
                  marginTop: 12,
                }}
              >
                {attachmentError}
              </p>
            )}

            <div style={{ marginTop: 20 }}>
              <h3>Uploaded files</h3>

              {attachmentsLoading ? (
                <p className="muted">
                  Loading attachments...
                </p>
              ) : attachments.length === 0 ? (
                <p className="muted">
                  No attachments uploaded yet.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        padding: 12,
                        border:
                          '1px solid var(--line, #e5e7eb)',
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {attachment.file_name}
                        </div>

                        <div
                          className="muted"
                          style={{ fontSize: 12 }}
                        >
                          {formatFileSize(attachment.file_size)}
                          {' • '}
                          {new Date(
                            attachment.created_at
                          ).toLocaleString('en-PH')}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn"
                        disabled={downloadingId !== null}
                        onClick={() => downloadFile(attachment)}
                      >
                        {downloadingId === attachment.id
                          ? 'Downloading...'
                          : 'Download'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{ alignSelf: 'start' }}
        >
          {role === 'employee' ? (
            <>
              <h3>Update progress</h3>

              <div
                className="seg"
                style={{ marginTop: 0 }}
              >
                {[
                  ['pending', 'Not started'],
                  ['in_progress', 'In progress'],
                  ['completed', 'Done'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={
                      status === value ? 'on' : ''
                    }
                    onClick={() => {
                      setStatus(value);

                      if (value === 'completed') {
                        setProgress(100);
                      }

                      if (value === 'pending') {
                        setProgress(0);
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="f">
                Progress <b>{progress}%</b>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  style={{
                    width: '100%',
                    accentColor: 'var(--pri)',
                  }}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setProgress(value);

                    if (value === 100) {
                      setStatus('completed');
                    } else if (value === 0) {
                      setStatus('pending');
                    } else {
                      setStatus('in_progress');
                    }
                  }}
                />
              </label>

              <button
                className="btn p full"
                disabled={saving}
                onClick={saveProgress}
              >
                {saving
                  ? 'Saving...'
                  : 'Save progress'}
              </button>

              <button
                className="btn full"
                style={{ marginTop: 10 }}
                onClick={() =>
                  go(`accomplish?id=${task.id}`)
                }
              >
                Submit accomplishment
              </button>
            </>
          ) : (
            <>
              <h3>Status</h3>

              <span className="chip pd">
                {statusLabels[task.status] ||
                  task.status}
              </span>

              <div
                className="bar"
                style={{ margin: '14px 0' }}
              >
                <i
                  style={{
                    width: `${task.progress ?? 0}%`,
                  }}
                />
              </div>

              <p className="muted">
                {task.progress ?? 0}% completed
              </p>

              <button
                className="btn p full"
                onClick={() =>
                  go(`taskcreate?id=${task.id}`)
                }
              >
                Edit task
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
