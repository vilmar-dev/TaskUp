'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';
import { Banner } from '@/components/ui';

export default function ProjectsPage() {
  const supabase = createClient();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Projects error:', error);
      setProjects([]);
    } else {
      setProjects(data || []);
    }

    setLoading(false);
  }

  async function createProject(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('Please enter a project name.');
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('Unable to identify the logged-in user.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('projects').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: 'active',
      created_by: user.id,
    });

    if (error) {
      console.error('Create project error:', error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setForm({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
    });

    setShowForm(false);
    setSaving(false);

    await loadProjects();
  }

  return (
    <>
      <Banner
        title="Projects"
        sub="Create and manage team projects."
        action={
          <button
            className="btn p"
            onClick={() => setShowForm(!showForm)}
          >
            <Icon n="plus" />
            {showForm ? 'Cancel' : 'New project'}
          </button>
        }
      />

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 18 }}>Create new project</h3>

          <form onSubmit={createProject} className="project-form">

            {/* PROJECT NAME */}
            <div className="project-field">
              <label>
                <strong>Project name</strong>
              </label>

              <input
                className="inp"
                type="text"
                placeholder="Enter project name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* DESCRIPTION */}
            <div className="project-field">
              <label>
                <strong>Description</strong>
              </label>

              <textarea
                className="inp"
                placeholder="Enter project description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                rows="4"
              />
            </div>

            {/* PROJECT DATES */}
            <div className="project-dates">

              <div className="project-field">
                <label>
                  <strong>Start date</strong>
                </label>

                <input
                  className="inp"
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="project-field">
                <label>
                  <strong>End date</strong>
                </label>

                <input
                  className="inp"
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>

            </div>

            {/* CREATE BUTTON */}
            <div>
              <button
                className="btn p"
                type="submit"
                disabled={saving}
              >
                <Icon n="plus" />
                {saving ? 'Creating...' : 'Create project'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* PROJECT LIST */}
      <div className="card">
        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '45px 20px',
            }}
          >
            <h3>No projects yet</h3>

            <p
              className="muted"
              style={{ marginTop: 8 }}
            >
              Create your first project to start organizing tasks.
            </p>
          </div>
        ) : (
          <div className="tw">
            <table>
              <tbody>

                <tr className="hd">
                  <th>Project</th>
                  <th>Status</th>
                  <th>Start date</th>
                  <th>End date</th>
                </tr>

                {projects.map((project) => (
                  <tr key={project.id}>

                    <td data-l="Project">
                      <strong>{project.name}</strong>

                      {project.description && (
                        <div className="sm muted">
                          {project.description}
                        </div>
                      )}
                    </td>

                    <td data-l="Status">
                      <span
                        className={
                          project.status === 'completed'
                            ? 'chip ok'
                            : 'chip'
                        }
                      >
                        {project.status}
                      </span>
                    </td>

                    <td data-l="Start date">
                      {project.start_date || '—'}
                    </td>

                    <td data-l="End date">
                      {project.end_date || '—'}
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