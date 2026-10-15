
'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/Providers';
import { Banner, Fld } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function Evaluate() {
  const { toast } = useApp();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [forms, setForms] = useState({});

  useEffect(() => {
    let active = true;

    async function loadSubmissions() {
      const supabase = createClient();

      const { data, error: submissionError } = await supabase
        .from('work_submissions')
        .select('id, task_id, employee_id, accomplishment, submitted_at')
        .order('submitted_at', { ascending: false });

      if (!active) return;

      if (submissionError) {
        setError(submissionError.message);
        setLoading(false);
        return;
      }

      const records = data || [];
      const taskIds = [...new Set(records.map((s) => s.task_id))];
      const employeeIds = [...new Set(records.map((s) => s.employee_id))];

      let taskNames = {};
      let employeeNames = {};
      let evaluationMap = {};

      if (taskIds.length > 0) {
        const { data: tasks, error: taskError } = await supabase
          .from('tasks')
          .select('id, title')
          .in('id', taskIds);

        if (taskError) {
          setError(taskError.message);
          setLoading(false);
          return;
        }

        taskNames = Object.fromEntries(
          (tasks || []).map((task) => [task.id, task.title])
        );
      }

      if (employeeIds.length > 0) {
        const { data: employees, error: employeeError } =
          await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', employeeIds);

        if (employeeError) {
          setError(employeeError.message);
          setLoading(false);
          return;
        }

        employeeNames = Object.fromEntries(
          (employees || []).map((employee) => [
            employee.id,
            employee.full_name,
          ])
        );
      }

      if (records.length > 0) {
        const { data: evaluations, error: evaluationError } =
          await supabase
            .from('evaluations')
            .select('submission_id, approval_status, approved_at')
            .in(
              'submission_id',
              records.map((record) => record.id)
            );

        if (evaluationError) {
          setError(evaluationError.message);
          setLoading(false);
          return;
        }

        evaluationMap = Object.fromEntries(
          (evaluations || []).map((evaluation) => [
            evaluation.submission_id,
            evaluation,
          ])
        );
      }

      if (!active) return;

      setSubmissions(
        records.map((record) => {
          const evaluation = evaluationMap[record.id];

          return {
            ...record,
            taskName: taskNames[record.task_id] || 'Unknown task',
            employeeName:
              employeeNames[record.employee_id] || 'Employee',
            evaluated: Boolean(evaluation),
            approvalStatus: evaluation?.approval_status || null,
            approvedAt: evaluation?.approved_at || null,
          };
        })
      );

      setError('');
      setLoading(false);
    }

    loadSubmissions();

    return () => {
      active = false;
    };
  }, []);

  function updateForm(submissionId, field, value) {
    setForms((previous) => ({
      ...previous,
      [submissionId]: {
        rating: 5,
        feedback: '',
        ...previous[submissionId],
        [field]: value,
      },
    }));
  }

  async function submitEvaluation(submissionId) {
    if (savingId) return;

    const form = forms[submissionId] || {
      rating: 5,
      feedback: '',
    };

    setSavingId(submissionId);

    try {
      const supabase = createClient();

      const { error: evaluationError } = await supabase.rpc(
        'evaluate_work',
        {
          target_submission_id: submissionId,
          new_rating: Number(form.rating),
          new_feedback: form.feedback,
        }
      );

      if (evaluationError) throw evaluationError;

      setSubmissions((previous) =>
        previous.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                evaluated: true,
                approvalStatus: 'pending',
                approvedAt: null,
              }
            : submission
        )
      );

      toast('Evaluation saved successfully');
    } catch (evaluationError) {
      console.error('Evaluate work error:', evaluationError);
      alert(evaluationError.message);
    } finally {
      setSavingId(null);
    }
  }

  async function approveSubmission(submissionId) {
    if (savingId) return;

    const confirmed = window.confirm(
      'Approve this accomplishment? The attachment cleanup countdown will start after approval.'
    );

    if (!confirmed) return;

    setSavingId(submissionId);

    try {
      const supabase = createClient();

      const { error: approvalError } = await supabase.rpc(
        'approve_work_submission',
        { target_submission_id: submissionId }
      );

      if (approvalError) throw approvalError;

      const { data: evaluation, error: reloadError } = await supabase
        .from('evaluations')
        .select('approval_status, approved_at')
        .eq('submission_id', submissionId)
        .single();

      if (reloadError) throw reloadError;

      setSubmissions((previous) =>
        previous.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                approvalStatus: evaluation.approval_status,
                approvedAt: evaluation.approved_at,
              }
            : submission
        )
      );

      toast('Accomplishment approved successfully');
    } catch (approvalError) {
      console.error('Approve accomplishment error:', approvalError);
      alert(approvalError.message);
    } finally {
      setSavingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return 'Not recorded';

    return new Date(value).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <>
      <Banner
        title="Evaluate accomplishments"
        sub="Review, evaluate, and approve submitted work."
      />

      {loading ? (
        <div className="card">
          <p>Loading employee submissions...</p>
        </div>
      ) : error ? (
        <div className="card">
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="card">
          <h3>No submissions yet</h3>
          <p className="muted">
            Employee accomplishments will appear here after submission.
          </p>
        </div>
      ) : (
        submissions.map((submission) => {
          const form = forms[submission.id] || {
            rating: 5,
            feedback: '',
          };

          const approved = submission.approvalStatus === 'approved';
          const pending =
            submission.evaluated && submission.approvalStatus === 'pending';

          return (
            <div
              className="card"
              key={submission.id}
              style={{ marginBottom: 18 }}
            >
              <div className="row sb wrap">
                <h3 style={{ margin: 0 }}>
                  {submission.taskName}
                </h3>

                <span
                  className={
                    approved
                      ? 'chip ok'
                      : submission.evaluated
                        ? 'chip pd'
                        : 'chip pd'
                  }
                >
                  {approved
                    ? 'Approved'
                    : pending
                      ? 'Pending approval'
                      : submission.evaluated
                        ? 'Evaluated'
                        : 'Needs review'}
                </span>
              </div>

              <p className="muted sm">
                {submission.employeeName} submitted{' '}
                {formatDate(submission.submitted_at)}
              </p>

              <h4>Accomplishment</h4>
              <p className="muted">{submission.accomplishment}</p>

              {!submission.evaluated && (
                <>
                  <Fld label="Rating">
                    <select
                      className="in"
                      value={form.rating}
                      onChange={(e) =>
                        updateForm(
                          submission.id,
                          'rating',
                          Number(e.target.value)
                        )
                      }
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Very good</option>
                      <option value={3}>3 - Good</option>
                      <option value={2}>2 - Needs improvement</option>
                      <option value={1}>1 - Poor</option>
                    </select>
                  </Fld>

                  <Fld label="Feedback">
                    <textarea
                      className="in"
                      placeholder="Add remarks for the employee"
                      value={form.feedback}
                      onChange={(e) =>
                        updateForm(
                          submission.id,
                          'feedback',
                          e.target.value
                        )
                      }
                    />
                  </Fld>

                  <button
                    className="btn p"
                    disabled={savingId !== null}
                    onClick={() => submitEvaluation(submission.id)}
                  >
                    {savingId === submission.id
                      ? 'Saving...'
                      : 'Save evaluation'}
                  </button>
                </>
              )}

              {pending && (
                <div style={{ marginTop: 16 }}>
                  <p className="muted sm">
                    Evaluation saved. Supervisor approval is required
                    before attachment cleanup.
                  </p>

                  <button
                    className="btn p"
                    disabled={savingId !== null}
                    onClick={() => approveSubmission(submission.id)}
                  >
                    {savingId === submission.id
                      ? 'Approving...'
                      : 'Approve Accomplishment'}
                  </button>
                </div>
              )}

              {approved && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ color: 'green' }}>
                    Accomplishment approved
                  </p>

                  <p className="muted sm">
                    Approval time: {formatDate(submission.approvedAt)}
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
