import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, tasksApi } from '../services/api';
import type { Project, Task } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Folder, CheckSquare, Users, Calendar, ArrowRight, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Project creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // User's tasks summary state
  const [userTasks, setUserTasks] = useState<Task[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projRes = await projectsApi.getAll();
      setProjects(projRes.data);

      const allTasks: Task[] = [];
      for (const proj of projRes.data) {
        try {
          const taskRes = await tasksApi.getByProject(proj.id);
          allTasks.push(...taskRes.data);
        } catch (taskErr) {
          console.error(`Failed to load tasks for project ${proj.id}`, taskErr);
        }
      }
      
      const assignedTasks = allTasks.filter(t => t.assignee?.id === user?.id);
      setUserTasks(assignedTasks);
    } catch (err: any) {
      setError('Failed to load dashboard data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setSubmitting(true);
      const res = await projectsApi.create({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
      });
      setProjects(prev => [...prev, res.data]);
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-indigo-600">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your DevForge dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-md">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {user?.username}!</h1>
          <p className="mt-2 text-indigo-100 max-w-xl">
            Manage your workspace projects, coordinate tasks, and collaborate with your development team.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-semibold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 shadow-md transition-all duration-200"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Project
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects list/grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Folder className="h-5 w-5 text-indigo-500" />
              Active Projects
            </h2>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-full">
              {projects.length} Total
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl p-8">
              <Folder className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No active projects</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
                Get started by creating your first collaborative project.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {project.name}
                      </h3>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        project.owner.id === user?.id
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {project.owner.id === user?.id ? 'Owner' : 'Member'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-3">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 mt-6 pt-4 text-gray-400 text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="h-4 w-4 text-gray-400" />
                      {project.members?.length || 0} members
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-indigo-600 font-bold transition-colors">
                      Open Board <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User's tasks summary panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-500" />
              My Work List
            </h2>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-full">
              {userTasks.length} Assigned
            </span>
          </div>

          {userTasks.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center py-12">
              <CheckSquare className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No tasks assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/projects/${task.project.id}`)}
                  className="bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-100 cursor-pointer shadow-sm hover:shadow transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 text-sm hover:text-indigo-600 transition-colors line-clamp-1">
                      {task.title}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      task.status === 'DONE'
                        ? 'bg-green-50 text-green-700'
                        : task.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {task.description || 'No description.'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-50 pt-2">
                    <span className="font-medium truncate max-w-[120px]">
                      Project: {task.project.name}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Create New Project</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-indigo-100 text-lg font-semibold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label htmlFor="pname" className="block text-sm font-semibold text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  id="pname"
                  type="text"
                  required
                  placeholder="e.g., Mobile Redesign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="pdesc" className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="pdesc"
                  rows={3}
                  placeholder="Describe the goals and deliverables..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
