import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  projectsApi,
  tasksApi,
  usersApi,
  commentsApi,
  subtasksApi,
  activityApi,
  gitApi,
  automationsApi,
} from '../services/api';
import type {
  Project,
  Task,
  User,
  Comment,
  Subtask,
  ActivityLog,
  GitEvent,
  BoardAutomationRule,
} from '../services/api';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FolderGit2,
  Loader2,
  Trash,
  Search,
  Filter,
  Activity,
  ListTodo,
  CheckSquare,
  GitCommit,
  GitPullRequest,
  Zap,
} from 'lucide-react';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const projId = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState<'TO_DO' | 'IN_PROGRESS' | 'DONE'>('TO_DO');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState<number | null>(null);
  const [taskDueDate, setTaskDueDate] = useState('');

  // Add member form state
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<number | null>(null);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'git' | 'automation' | 'email'>('members');

  // View mode state (board vs analytics charts)
  const [viewMode, setViewMode] = useState<'board' | 'analytics'>('board');

  // Git Webhook Simulation state
  const [gitEventType, setGitEventType] = useState<'COMMIT' | 'PR_OPEN' | 'PR_MERGE'>('COMMIT');
  const [gitRefName, setGitRefName] = useState('main');
  const [gitAuthor, setGitAuthor] = useState(user?.username || 'developer');
  const [gitMessage, setGitMessage] = useState('fix: resolve checklist status bug (#1)');
  const [gitSimLoading, setGitSimLoading] = useState(false);
  const [gitSimSuccess, setGitSimSuccess] = useState<string | null>(null);

  // Task Details Modal Git state
  const [linkedGitEvents, setLinkedGitEvents] = useState<GitEvent[]>([]);
  const [loadingGitEvents, setLoadingGitEvents] = useState(false);
  const [taskDetailTab, setTaskDetailTab] = useState<'subtasks' | 'comments' | 'git'>('subtasks');

  // Board Automation Rules state
  const [automationRules, setAutomationRules] = useState<BoardAutomationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleName, setRuleName] = useState('Auto-Complete Task');
  const [ruleTrigger, setRuleTrigger] = useState<'ALL_SUBTASKS_COMPLETED' | 'TASK_MOVED' | 'TASK_CREATED'>('ALL_SUBTASKS_COMPLETED');
  const [ruleTriggerValue, setRuleTriggerValue] = useState<string>('IN_PROGRESS');
  const [ruleAction, setRuleAction] = useState<'MOVE_TASK' | 'AUTO_ASSIGN'>('MOVE_TASK');
  const [ruleActionValue, setRuleActionValue] = useState<string>('DONE');

  // Email Simulation state
  const [emailFrom, setEmailFrom] = useState(user?.email || '');
  const [emailSubject, setEmailSubject] = useState('New feature request');
  const [emailText, setEmailText] = useState('Please implement the new feature.');
  const [emailSimLoading, setEmailSimLoading] = useState(false);

  const isOwner = project?.owner?.id === user?.id;

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const projRes = await projectsApi.getById(projId);
      setProject(projRes.data);

      const taskRes = await tasksApi.getByProject(projId);
      setTasks(taskRes.data);

      if (projRes.data.owner.id === user?.id) {
        const usersRes = await usersApi.getAll();
        setAllUsers(usersRes.data);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setError('You are not authorized to view this project board.');
      } else if (err.response?.status === 404) {
        setError('Project not found.');
      } else {
        setError('Failed to load project board. Make sure the backend is active.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLoadingActivity(true);
      const res = await activityApi.getByProject(projId);
      setActivityLogs(res.data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (projId) {
      fetchProjectData();
      fetchActivityLogs();
    }
  }, [projId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserIdToAdd) return;

    try {
      await projectsApi.addMember(projId, selectedUserIdToAdd);
      await fetchProjectData();
      await fetchActivityLogs();
      setIsMemberModalOpen(false);
      setSelectedUserIdToAdd(null);
    } catch (err) {
      console.error(err);
      alert('Failed to add member to project.');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return;
    try {
      await projectsApi.removeMember(projId, memberId);
      await fetchProjectData();
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to remove member.');
    }
  };

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        status: taskStatus,
        priority: taskPriority,
        assigneeId: taskAssigneeId || null,
        dueDate: taskDueDate || null,
      };

      if (selectedTask) {
        await tasksApi.update(selectedTask.id, payload);
      } else {
        await tasksApi.create(projId, payload);
      }

      await fetchProjectData();
      await fetchActivityLogs();
      closeTaskModal();
    } catch (err) {
      console.error(err);
      alert('Failed to save task.');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      await fetchProjectData();
      await fetchActivityLogs();
      closeTaskModal();
    } catch (err) {
      console.error(err);
      alert('Failed to delete task.');
    }
  };

  const handleSimulateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.inboxEmailAddress) return;
    try {
      setEmailSimLoading(true);
      await projectsApi.simulateEmail({
        to: project.inboxEmailAddress,
        from: emailFrom,
        subject: emailSubject,
        text: emailText
      });
      await fetchProjectData();
      await fetchActivityLogs();
      alert('Email simulation successful! Task created.');
    } catch (err) {
      console.error(err);
      alert('Failed to simulate email webhook.');
    } finally {
      setEmailSimLoading(false);
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: 'TO_DO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await tasksApi.update(task.id, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        assigneeId: task.assignee?.id || null,
        dueDate: task.dueDate,
      });
      await fetchProjectData();
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to update task status.');
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: 'TO_DO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr, 10);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status !== status) {
      await handleQuickStatusChange(task, status);
    }
  };

  const fetchGitEvents = async (taskId: number) => {
    try {
      setLoadingGitEvents(true);
      const res = await gitApi.getByTask(taskId);
      setLinkedGitEvents(res.data);
    } catch (err) {
      console.error('Failed to load git events', err);
    } finally {
      setLoadingGitEvents(false);
    }
  };

  const handleTriggerGitSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setGitSimLoading(true);
    setGitSimSuccess(null);
    try {
      const res = await gitApi.triggerMockWebhook({
        type: gitEventType,
        refName: gitRefName,
        author: gitAuthor,
        message: gitMessage,
        url: `https://github.com/${gitAuthor}/mock-repo/${gitEventType.startsWith('PR') ? 'pull' : 'commit'}/${Math.floor(Math.random() * 1000)}`
      });
      setGitSimSuccess(res.data.message || 'Webhook successfully simulated!');
      await fetchProjectData();
      await fetchActivityLogs();
    } catch (err: any) {
      console.error(err);
      alert('Failed to simulate git webhook: ' + (err.response?.data?.message || err.message));
    } finally {
      setGitSimLoading(false);
    }
  };

  const fetchAutomationRules = async () => {
    try {
      setLoadingRules(true);
      const res = await automationsApi.getByProject(projId);
      setAutomationRules(res.data);
    } catch (err) {
      console.error('Failed to load automation rules', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await automationsApi.create(projId, {
        name: ruleName.trim(),
        triggerType: ruleTrigger,
        triggerValue: ruleTrigger === 'TASK_MOVED' ? ruleTriggerValue : undefined,
        actionType: ruleAction,
        actionValue: ruleActionValue,
      });
      setRuleName('Auto-Complete Task');
      await fetchAutomationRules();
      await fetchActivityLogs();
    } catch (err: any) {
      console.error(err);
      alert('Failed to create automation rule: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    try {
      await automationsApi.toggle(ruleId);
      await fetchAutomationRules();
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle automation rule.');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!window.confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await automationsApi.delete(ruleId);
      await fetchAutomationRules();
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete automation rule.');
    }
  };

  const fetchComments = async (taskId: number) => {
    try {
      setLoadingComments(true);
      const res = await commentsApi.getByTask(taskId);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;

    try {
      const res = await commentsApi.create(selectedTask.id, newCommentText.trim());
      setComments((prev) => [...prev, res.data]);
      setNewCommentText('');
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to add comment.');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete comment.');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;

    try {
      setLoadingSubtasks(true);
      const res = await subtasksApi.create(selectedTask.id, newSubtaskTitle.trim());
      setSubtasks((prev) => [...prev, res.data]);
      setNewSubtaskTitle('');
      await fetchProjectData();
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to add subtask.');
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const handleToggleSubtask = async (sub: Subtask) => {
    try {
      const res = await subtasksApi.update(sub.id, {
        title: sub.title,
        completed: !sub.completed,
      });
      setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? res.data : s)));
      await fetchProjectData();
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle subtask status.');
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) return;
    try {
      await subtasksApi.delete(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
      await fetchProjectData();
      await fetchActivityLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete subtask.');
    }
  };

  const openTaskModal = (task: Task | null = null, defaultColStatus: 'TO_DO' | 'IN_PROGRESS' | 'DONE' = 'TO_DO') => {
    setTaskDetailTab('subtasks');
    if (task) {
      setSelectedTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description || '');
      setTaskStatus(task.status);
      setTaskPriority(task.priority);
      setTaskAssigneeId(task.assignee?.id || null);
      setTaskDueDate(task.dueDate || '');
      setSubtasks(task.subtasks || []);
      fetchComments(task.id);
      fetchGitEvents(task.id);
    } else {
      setSelectedTask(null);
      setTaskTitle('');
      setTaskDesc('');
      setTaskStatus(defaultColStatus);
      setTaskPriority('MEDIUM');
      setTaskAssigneeId(null);
      setTaskDueDate('');
      setComments([]);
      setSubtasks([]);
      setLinkedGitEvents([]);
    }
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setComments([]);
    setLinkedGitEvents([]);
    setNewCommentText('');
    setSubtasks([]);
    setNewSubtaskTitle('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-indigo-600">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading project board...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center bg-white p-8 border border-gray-200 rounded-2xl shadow space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 text-sm">{error || 'An error occurred.'}</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAssignee =
      !filterAssignee ||
      (filterAssignee === 'unassigned' && !t.assignee) ||
      (t.assignee && t.assignee.id === Number(filterAssignee));

    const matchesPriority = !filterPriority || t.priority === filterPriority;

    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'TO_DO');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = filteredTasks.filter((t) => t.status === 'DONE');

  const existingMemberIds = new Set(project.members.map((m) => m.id));
  const addableUsers = allUsers.filter(
    (u) => u.id !== project.owner.id && !existingMemberIds.has(u.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex items-center gap-3">
            <FolderGit2 className="h-8 w-8 text-indigo-600 shrink-0" />
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{project.name}</h1>
          </div>
          <p className="text-gray-500 text-sm max-w-2xl">{project.description || 'No description provided.'}</p>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 self-start md:self-auto">
          <div className="flex items-center -space-x-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                title={`${member.username} (${member.role.replace('ROLE_', '')})`}
                className={`h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white uppercase ${
                  member.id === project.owner.id ? 'bg-purple-500' : 'bg-indigo-500'
                }`}
              >
                {member.username.substring(0, 2)}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {project.members.length} member{project.members.length > 1 ? 's' : ''}
          </div>
          {isOwner && (
            <button
              onClick={() => {
                setActiveTab('members');
                setIsMemberModalOpen(true);
                fetchAutomationRules();
              }}
              className="inline-flex items-center justify-center p-1.5 rounded-lg text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 transition"
              title="Manage Project Members"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex gap-6 border-b border-gray-200 text-sm font-medium">
        <button
          onClick={() => setViewMode('board')}
          className={`pb-2.5 transition border-b-2 -mb-[2px] ${
            viewMode === 'board' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-gray-500 hover:text-indigo-600'
          }`}
        >
          Kanban Board
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`pb-2.5 transition border-b-2 -mb-[2px] ${
            viewMode === 'analytics' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-gray-500 hover:text-indigo-600'
          }`}
        >
          Analytics Dashboard
        </button>
      </div>

      {viewMode === 'board' ? (
        <>
          {/* Search and Filters Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 shrink-0">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-bold uppercase tracking-wider text-gray-600">Filters</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Filter Assignee */}
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {project.members.map((member) => (
                  <option key={member.id} value={member.id.toString()}>
                    {member.username}
                  </option>
                ))}
              </select>

              {/* Filter Priority */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>

              {/* Clear Filters Button */}
              {(searchQuery || filterAssignee || filterPriority) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterAssignee('');
                    setFilterPriority('');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-1.5 px-2 bg-indigo-50 rounded-lg transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* TO DO COLUMN */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'TO_DO')}
              className="bg-gray-50 dark:bg-gray-850 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">To Do</h3>
                  <span className="text-xs bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold px-2 py-0.5 rounded-full">
                    {todoTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openTaskModal(null, 'TO_DO')}
                  className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-850 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 min-h-[300px]">
                {todoTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={() => openTaskModal(t)}
                    onStatusChange={(status) => handleQuickStatusChange(t, status)}
                    onDragStart={(e) => handleDragStart(e, t)}
                  />
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400 dark:text-gray-500">No tasks in To Do</div>
                )}
              </div>
            </div>

            {/* IN PROGRESS COLUMN */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
              className="bg-gray-50 dark:bg-gray-850 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">In Progress</h3>
                  <span className="text-xs bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold px-2 py-0.5 rounded-full">
                    {inProgressTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openTaskModal(null, 'IN_PROGRESS')}
                  className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-850 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 min-h-[300px]">
                {inProgressTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={() => openTaskModal(t)}
                    onStatusChange={(status) => handleQuickStatusChange(t, status)}
                    onDragStart={(e) => handleDragStart(e, t)}
                  />
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400 dark:text-gray-500">No tasks In Progress</div>
                )}
              </div>
            </div>

            {/* DONE COLUMN */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'DONE')}
              className="bg-gray-50 dark:bg-gray-850 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Done</h3>
                  <span className="text-xs bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold px-2 py-0.5 rounded-full">
                    {doneTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openTaskModal(null, 'DONE')}
                  className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-850 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 min-h-[300px]">
                {doneTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={() => openTaskModal(t)}
                    onStatusChange={(status) => handleQuickStatusChange(t, status)}
                    onDragStart={(e) => handleDragStart(e, t)}
                  />
                ))}
                {doneTasks.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400 dark:text-gray-500">No tasks completed</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                📋
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{tasks.length}</div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Tasks</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
                ✅
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{tasks.filter(t => t.status === 'DONE').length}</div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed Tasks</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                ⏳
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">In Progress</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">
                  {tasks.filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]).length}
                </div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overdue Tasks</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Status Donut Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-around gap-6">
              <div className="space-y-4 text-center md:text-left">
                <h3 className="font-extrabold text-gray-800 text-base">Task Status Ratio</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <span className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                    <span>Done: {tasks.filter(t => t.status === 'DONE').length} ({tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <span className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                    <span>In Progress: {tasks.filter(t => t.status === 'IN_PROGRESS').length} ({tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'IN_PROGRESS').length / tasks.length) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                    <span>To Do: {tasks.filter(t => t.status === 'TO_DO').length} ({tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'TO_DO').length / tasks.length) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>

              {/* Donut SVG */}
              <div className="relative flex items-center justify-center shrink-0">
                {tasks.length === 0 ? (
                  <div className="h-44 w-44 rounded-full border-4 border-gray-100 flex items-center justify-center text-xs text-gray-400 italic">No tasks</div>
                ) : (
                  <>
                    <svg viewBox="0 0 100 100" className="w-44 h-44 transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="10" />
                      {tasks.filter(t => t.status === 'DONE').length > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="10"
                          strokeDasharray={`${((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 251.3)} 251.3`}
                          strokeDashoffset={0}
                          className="transition-all duration-500"
                        />
                      )}
                      {tasks.filter(t => t.status === 'IN_PROGRESS').length > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#3b82f6"
                          strokeWidth="10"
                          strokeDasharray={`${((tasks.filter(t => t.status === 'IN_PROGRESS').length / tasks.length) * 251.3)} 251.3`}
                          strokeDashoffset={-((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 251.3)}
                          className="transition-all duration-500"
                        />
                      )}
                      {tasks.filter(t => t.status === 'TO_DO').length > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#f59e0b"
                          strokeWidth="10"
                          strokeDasharray={`${((tasks.filter(t => t.status === 'TO_DO').length / tasks.length) * 251.3)} 251.3`}
                          strokeDashoffset={-(((tasks.filter(t => t.status === 'DONE').length + tasks.filter(t => t.status === 'IN_PROGRESS').length) / tasks.length) * 251.3)}
                          className="transition-all duration-500"
                        />
                      )}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-gray-800">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) : 0}%</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chart 2: Priority Breakdown Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-extrabold text-gray-800 text-base">Task Priority Matrix</h3>
              <div className="flex justify-around items-end h-44 pt-4 border-b border-gray-100">
                {/* Low Priority bar */}
                <div className="flex flex-col items-center gap-2 w-16 group">
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">
                    {tasks.filter(t => t.priority === 'LOW').length} task{tasks.filter(t => t.priority === 'LOW').length !== 1 ? 's' : ''}
                  </span>
                  <div className="w-8 bg-gray-50 hover:bg-gray-100 rounded-t-lg h-32 flex items-end overflow-hidden border border-gray-100">
                    <div
                      className="w-full bg-gradient-to-t from-gray-400 to-indigo-400 transition-all duration-500"
                      style={{ height: `${(tasks.filter(t => t.priority === 'LOW').length / Math.max(tasks.filter(t => t.priority === 'LOW').length, tasks.filter(t => t.priority === 'MEDIUM').length, tasks.filter(t => t.priority === 'HIGH').length, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-400">Low</span>
                </div>

                {/* Medium Priority bar */}
                <div className="flex flex-col items-center gap-2 w-16 group">
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">
                    {tasks.filter(t => t.priority === 'MEDIUM').length} task{tasks.filter(t => t.priority === 'MEDIUM').length !== 1 ? 's' : ''}
                  </span>
                  <div className="w-8 bg-gray-50 hover:bg-gray-100 rounded-t-lg h-32 flex items-end overflow-hidden border border-gray-100">
                    <div
                      className="w-full bg-gradient-to-t from-blue-400 to-indigo-500 transition-all duration-500"
                      style={{ height: `${(tasks.filter(t => t.priority === 'MEDIUM').length / Math.max(tasks.filter(t => t.priority === 'LOW').length, tasks.filter(t => t.priority === 'MEDIUM').length, tasks.filter(t => t.priority === 'HIGH').length, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-400">Medium</span>
                </div>

                {/* High Priority bar */}
                <div className="flex flex-col items-center gap-2 w-16 group">
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">
                    {tasks.filter(t => t.priority === 'HIGH').length} task{tasks.filter(t => t.priority === 'HIGH').length !== 1 ? 's' : ''}
                  </span>
                  <div className="w-8 bg-gray-50 hover:bg-gray-100 rounded-t-lg h-32 flex items-end overflow-hidden border border-gray-100">
                    <div
                      className="w-full bg-gradient-to-t from-red-400 to-orange-500 transition-all duration-500"
                      style={{ height: `${(tasks.filter(t => t.priority === 'HIGH').length / Math.max(tasks.filter(t => t.priority === 'LOW').length, tasks.filter(t => t.priority === 'MEDIUM').length, tasks.filter(t => t.priority === 'HIGH').length, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-400">High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Row 2: Member Workloads */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
              👥 Collaborator Task Distribution
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {project.members.map((member) => {
                const memberTasks = tasks.filter((t) => t.assignee?.id === member.id);
                const memDone = memberTasks.filter((t) => t.status === 'DONE').length;
                const memProgress = memberTasks.filter((t) => t.status === 'IN_PROGRESS').length;
                const memTodo = memberTasks.filter((t) => t.status === 'TO_DO').length;
                const memTotal = memberTasks.length;
                
                const memDonePercent = memTotal > 0 ? (memDone / memTotal) * 100 : 0;
                const memProgressPercent = memTotal > 0 ? (memProgress / memTotal) * 100 : 0;
                const memTodoPercent = memTotal > 0 ? (memTodo / memTotal) * 100 : 0;

                return (
                  <div key={member.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {member.username.substring(0, 2)}
                        </div>
                        <div>
                          <span className="text-sm font-extrabold text-gray-800">{member.username}</span>
                          <span className="block text-[9px] text-gray-400 uppercase font-semibold">{member.role.replace('ROLE_', '')}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-600">
                        {memTotal} active task{memTotal !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {memTotal > 0 ? (
                      <div className="space-y-1.5">
                        <div className="w-full bg-gray-200 h-2.5 rounded-full flex overflow-hidden">
                          {memDone > 0 && (
                            <div
                              title={`Done: ${memDone}`}
                              style={{ width: `${memDonePercent}%` }}
                              className="bg-green-500 h-full transition-all duration-300"
                            />
                          )}
                          {memProgress > 0 && (
                            <div
                              title={`In Progress: ${memProgress}`}
                              style={{ width: `${memProgressPercent}%` }}
                              className="bg-blue-500 h-full transition-all duration-300"
                            />
                          )}
                          {memTodo > 0 && (
                            <div
                              title={`To Do: ${memTodo}`}
                              style={{ width: `${memTodoPercent}%` }}
                              className="bg-amber-500 h-full transition-all duration-300"
                            />
                          )}
                        </div>

                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span className="text-green-600">{memDone} Done</span>
                          <span className="text-blue-600">{memProgress} In Progress</span>
                          <span className="text-amber-600">{memTodo} To Do</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">No tasks currently assigned.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Project Settings Modal (Members Directory & Activity Feed) */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all max-h-[85vh] flex flex-col">
            {/* Tabbed Header */}
            <div className="px-6 py-4 bg-indigo-600 text-white shrink-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold">Project Details & Settings</h3>
                <button
                  onClick={() => setIsMemberModalOpen(false)}
                  className="text-white hover:text-indigo-100 text-lg font-semibold"
                >
                  &times;
                </button>
              </div>
              <div className="flex gap-4 border-b border-indigo-400 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('members')}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === 'members' ? 'border-white text-white font-bold' : 'border-transparent text-indigo-200 hover:text-white'
                  }`}
                >
                  Members Directory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('activity');
                    fetchActivityLogs();
                  }}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === 'activity' ? 'border-white text-white font-bold' : 'border-transparent text-indigo-200 hover:text-white'
                  }`}
                >
                  Activity Timeline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('git');
                    if (selectedTask) {
                      setGitMessage(`feat: resolve issue with task (#${selectedTask.id})`);
                      setGitRefName(`feature/task-${selectedTask.id}`);
                    }
                  }}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === 'git' ? 'border-white text-white font-bold' : 'border-transparent text-indigo-200 hover:text-white'
                  }`}
                >
                  Git Webhooks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('automation');
                    fetchAutomationRules();
                  }}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === 'automation' ? 'border-white text-white font-bold' : 'border-transparent text-indigo-200 hover:text-white'
                  }`}
                >
                  Automations
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === 'email' ? 'border-white text-white font-bold' : 'border-transparent text-indigo-200 hover:text-white'
                  }`}
                >
                  Email Intake
                </button>
              </div>
            </div>

            {/* Scrollable Content wrapper */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'members' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                      <Users className="h-4 w-4 text-indigo-500" /> Current Members
                    </h4>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {project.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
                              {member.username.substring(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{member.username}</div>
                              <div className="text-[10px] text-gray-400 capitalize">{member.role.replace('ROLE_', '').replace('_', ' ').toLowerCase()}</div>
                            </div>
                          </div>
                          {isOwner && member.id !== project.owner.id && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 transition"
                              title="Remove user from project"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {isOwner && addableUsers.length > 0 && (
                    <form onSubmit={handleAddMember} className="space-y-3 border-t pt-4">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <UserPlus className="h-4 w-4 text-indigo-500" /> Add New Member
                      </h4>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={selectedUserIdToAdd || ''}
                          onChange={(e) => setSelectedUserIdToAdd(Number(e.target.value) || null)}
                        >
                          <option value="">Select a user...</option>
                          {addableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.username} ({u.role.replace('ROLE_', '')})
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={!selectedUserIdToAdd}
                          className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : activeTab === 'activity' ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                    <Activity className="h-4 w-4 text-indigo-500 animate-pulse" /> Live Activity Feed
                  </h4>
                  
                  <div className="space-y-4 pr-1">
                    {loadingActivity ? (
                      <div className="flex items-center justify-center py-8 text-indigo-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6">No project activity logged yet.</p>
                    ) : (
                      <div className="relative border-l border-gray-200 pl-4 ml-2 space-y-5 text-xs">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="relative group/timeline">
                            {/* Timeline bullet dot */}
                            <span className="absolute -left-[22.5px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 ring-4 ring-indigo-50 flex items-center justify-center" />
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-gray-800 uppercase tracking-tight text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                  {log.action}
                                </span>
                                <span className="text-[9px] text-gray-400">
                                  {new Date(log.createdAt).toLocaleString(undefined, {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-600 leading-relaxed font-medium">{log.details}</p>
                              <div className="text-[9px] text-gray-400 flex items-center gap-1">
                                <span>by</span>
                                <span className="font-semibold text-gray-500">{log.actor ? log.actor.username : 'System Auto'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'git' ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                    <FolderGit2 className="h-4 w-4 text-indigo-500" /> Git Webhook Simulator
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    Simulate repository pushes and pull requests. DevForge automatically parses task identifiers like <code className="bg-gray-100 dark:bg-gray-850 px-1 py-0.5 rounded font-mono font-bold text-indigo-650 dark:text-indigo-400 text-[10px]">#&lt;id&gt;</code>, <code className="bg-gray-100 dark:bg-gray-850 px-1 py-0.5 rounded font-mono font-bold text-indigo-650 dark:text-indigo-400 text-[10px]">task-&lt;id&gt;</code> or <code className="bg-gray-100 dark:bg-gray-850 px-1 py-0.5 rounded font-mono font-bold text-indigo-650 dark:text-indigo-400 text-[10px]">DF-&lt;id&gt;</code> in branch names or commit messages to link events.
                  </p>

                  <form onSubmit={handleTriggerGitSimulation} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Event Type</label>
                        <select
                          value={gitEventType}
                          onChange={(e) => setGitEventType(e.target.value as any)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="COMMIT">Git Commit</option>
                          <option value="PR_OPEN">Pull Request: Open</option>
                          <option value="PR_MERGE">Pull Request: Merge & Close</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Author</label>
                        <input
                          type="text"
                          required
                          value={gitAuthor}
                          onChange={(e) => setGitAuthor(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Branch / Reference</label>
                        <input
                          type="text"
                          required
                          value={gitRefName}
                          onChange={(e) => setGitRefName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Link Target</label>
                        <div className="text-[11px] font-bold text-gray-500 dark:text-indigo-400 py-1.5">
                          {selectedTask ? `Task ID: #${selectedTask.id}` : 'Hint: Open a task details modal first to target it!'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Message</label>
                      <input
                        type="text"
                        required
                        value={gitMessage}
                        onChange={(e) => setGitMessage(e.target.value)}
                        placeholder="e.g. fix: resolve details drawer layout (#1)"
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {gitSimSuccess && (
                      <div className="text-[11px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-2 rounded-lg border border-green-200 dark:border-green-800">
                        {gitSimSuccess}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={gitSimLoading}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition"
                      >
                        {gitSimLoading ? 'Simulating...' : 'Trigger Git Webhook'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : activeTab === 'automations' ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b pb-1.5 mb-3">
                      <Zap className="h-4 w-4 text-indigo-500 animate-bounce" /> Create Automation Rule
                    </h4>

                    <form onSubmit={handleCreateRule} className="space-y-3 bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-805">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">WHEN (Trigger Event)</label>
                          <select
                            value={ruleTrigger}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setRuleTrigger(val);
                              if (val === 'ALL_SUBTASKS_COMPLETED') {
                                setRuleAction('MOVE_TASK');
                                setRuleActionValue('DONE');
                                setRuleName('Auto-move task to Done when checklist is complete');
                              } else if (val === 'TASK_MOVED') {
                                setRuleAction('AUTO_ASSIGN');
                                setRuleActionValue('ACTOR');
                                setRuleName('Auto-assign task to actor when moved to In Progress');
                              } else if (val === 'TASK_CREATED') {
                                setRuleAction('AUTO_ASSIGN');
                                setRuleActionValue('OWNER');
                                setRuleName('Auto-assign task to project creator when created');
                              }
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="ALL_SUBTASKS_COMPLETED">All subtasks / checklist completed</option>
                            <option value="TASK_MOVED">Task is moved to status</option>
                            <option value="TASK_CREATED">New task is created</option>
                          </select>
                        </div>

                        {ruleTrigger === 'TASK_MOVED' ? (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status Condition</label>
                            <select
                              value={ruleTriggerValue}
                              onChange={(e) => {
                                setRuleTriggerValue(e.target.value);
                                setRuleName(`Auto-assign task to actor when moved to ${e.target.value.replace('_', ' ')}`);
                              }}
                              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="TO_DO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Condition</label>
                            <div className="text-xs text-gray-400 py-1.5 font-medium italic">No parameters required</div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">THEN (Result Action)</label>
                          <select
                            value={ruleAction}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setRuleAction(val);
                              if (val === 'MOVE_TASK') {
                                setRuleActionValue('DONE');
                              } else {
                                setRuleActionValue('ACTOR');
                              }
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="MOVE_TASK">Move task card to status</option>
                            <option value="AUTO_ASSIGN">Auto assign task card to</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Action Parameter</label>
                          {ruleAction === 'MOVE_TASK' ? (
                            <select
                              value={ruleActionValue}
                              onChange={(e) => setRuleActionValue(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="TO_DO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          ) : (
                            <select
                              value={ruleActionValue}
                              onChange={(e) => setRuleActionValue(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="ACTOR">The Triggering User (Actor)</option>
                              <option value="OWNER">Project Owner / Creator</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Rule Description Name</label>
                        <input
                          type="text"
                          required
                          value={ruleName}
                          onChange={(e) => setRuleName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-750 rounded-lg shadow-sm transition"
                        >
                          Add Rule
                        </button>
                      </div>
                    </form>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b pb-1.5 mb-3">
                      Active Automation Rules ({automationRules.length})
                    </h4>

                    {loadingRules ? (
                      <div className="flex items-center justify-center py-6 text-indigo-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : automationRules.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6">No automation rules configured for this board yet.</p>
                    ) : (
                      <div className="space-y-2 text-gray-850">
                        {automationRules.map((rule) => (
                          <div key={rule.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-905 text-xs flex justify-between items-center gap-4 hover:shadow-sm transition">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`h-4 w-4 rounded-full flex items-center justify-center ${rule.active ? 'bg-amber-105 text-amber-600 dark:bg-amber-950/20' : 'bg-gray-150 text-gray-400'}`}>
                                  <Zap className="h-2.5 w-2.5" />
                                </span>
                                <span className="font-extrabold text-gray-800 dark:text-gray-200">{rule.name}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-semibold pl-6">
                                WHEN <span className="text-indigo-600 dark:text-indigo-400">{rule.triggerType.replace(/_/g, ' ')}</span>
                                {rule.triggerType === 'TASK_MOVED' && (
                                  <span> (<span className="font-bold">{rule.triggerValue}</span>)</span>
                                )}
                                {' '}THEN <span className="text-indigo-600 dark:text-indigo-400">{rule.actionType.replace(/_/g, ' ')}</span>
                                {' '}to <span className="font-bold text-gray-650 dark:text-gray-300">{rule.actionValue}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleRule(rule.id)}
                                className={`w-8 h-4 rounded-full transition-colors relative focus:outline-none ${
                                  rule.active ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                              >
                                <span className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${
                                  rule.active ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>

                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-red-400 hover:text-red-650 p-1 transition"
                                title="Delete Rule"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'email' ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                    Email-to-Task Ingestion
                  </h4>
                  <div className="text-xs text-gray-600 mb-4">
                    Send an email to this address to automatically create a task in this project:
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-center font-mono text-sm font-bold text-indigo-700 dark:text-indigo-400 select-all">
                      {project?.inboxEmailAddress || 'Not configured'}
                    </div>
                  </div>
                  
                  <form onSubmit={handleSimulateEmail} className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-bold text-xs text-gray-800 dark:text-gray-200">Simulate Inbound Email</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From</label>
                        <input
                          type="email"
                          required
                          value={emailFrom}
                          onChange={(e) => setEmailFrom(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Text / Body</label>
                      <textarea
                        required
                        rows={3}
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={emailSimLoading}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition"
                      >
                        {emailSimLoading ? 'Simulating...' : 'Send Simulation'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold">{selectedTask ? 'Edit Task' : 'Add New Task'}</h3>
              <button
                onClick={closeTaskModal}
                className="text-white hover:text-indigo-100 text-lg font-semibold"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <form onSubmit={handleCreateOrUpdateTask} className="space-y-4">
                <div>
                  <label htmlFor="tname" className="block text-sm font-semibold text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    id="tname"
                    type="text"
                    required
                    placeholder="e.g. Implement User Authentication"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="tdesc" className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="tdesc"
                    rows={3}
                    placeholder="Add details, links, or expectations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tstatus" className="block text-sm font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="tstatus"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as any)}
                    >
                      <option value="TO_DO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tpriority" className="block text-sm font-semibold text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="tpriority"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tassignee" className="block text-sm font-semibold text-gray-700 mb-1">
                      Assignee
                    </label>
                    <select
                      id="tassignee"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={taskAssigneeId || ''}
                      onChange={(e) => setTaskAssigneeId(Number(e.target.value) || null)}
                    >
                      <option value="">Unassigned</option>
                      {project.members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tduedate" className="block text-sm font-semibold text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      id="tduedate"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-6">
                  {selectedTask ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Task
                  </button>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeTaskModal}
                      className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>

              {/* Tab Selector row */}
              {selectedTask && (
                <div className="flex gap-4 border-b border-gray-100 text-xs font-semibold pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTaskDetailTab('subtasks')}
                    className={`pb-2 transition border-b-2 -mb-[2px] ${
                      taskDetailTab === 'subtasks' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-gray-500 hover:text-indigo-600'
                    }`}
                  >
                    Checklist ({subtasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskDetailTab('comments')}
                    className={`pb-2 transition border-b-2 -mb-[2px] ${
                      taskDetailTab === 'comments' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-gray-500 hover:text-indigo-600'
                    }`}
                  >
                    Discussion ({comments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskDetailTab('git')}
                    className={`pb-2 transition border-b-2 -mb-[2px] ${
                      taskDetailTab === 'git' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-gray-500 hover:text-indigo-600'
                    }`}
                  >
                    Git Events ({linkedGitEvents.length})
                  </button>
                </div>
              )}

              {/* Subtasks Checklist Section */}
              {selectedTask && taskDetailTab === 'subtasks' && (
                <div className="pt-4 space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-indigo-500 animate-pulse" /> Subtasks Checklist
                  </h4>

                  {/* List of subtasks */}
                  <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                    {subtasks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-1">No subtasks added yet.</p>
                    ) : (
                      subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between group/subtask hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 select-none">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => handleToggleSubtask(sub)}
                              className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                            />
                            <span className={sub.completed ? 'line-through text-gray-400' : 'font-medium'}>
                              {sub.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(sub.id)}
                            className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover/subtask:opacity-100 transition-opacity"
                            title="Delete subtask"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add subtask form */}
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a subtask..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim() || loadingSubtasks}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors shrink-0"
                    >
                      {loadingSubtasks ? 'Adding...' : 'Add'}
                    </button>
                  </form>
                </div>
              )}

              {/* Discussion / Comments Section */}
              {selectedTask && taskDetailTab === 'comments' && (
                <div className="pt-4 space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-500 animate-pulse" /> Discussion
                  </h4>
                  
                  {/* List of comments */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-4 text-indigo-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">No comments yet. Start the conversation!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200/50 space-y-1 group/comment relative">
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span className="font-bold text-gray-600 flex items-center gap-1">
                              <span className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] uppercase">
                                {comment.author.username.substring(0, 2)}
                              </span>
                              {comment.author.username}
                            </span>
                            <span className="text-[9px]">
                              {new Date(comment.createdAt).toLocaleString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 whitespace-pre-wrap pl-5">{comment.text}</p>
                          
                          {(comment.author.id === user?.id || project.owner.id === user?.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover/comment:opacity-100 transition-opacity p-0.5"
                              title="Delete comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a comment..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim()}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              )}

              {/* Git Events Section */}
              {selectedTask && taskDetailTab === 'git' && (
                <div className="pt-4 space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <FolderGit2 className="h-4 w-4 text-indigo-500" /> Git Activity Logs
                  </h4>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {loadingGitEvents ? (
                      <div className="flex items-center justify-center py-4 text-indigo-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : linkedGitEvents.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-gray-400 italic">No git commits or PRs linked yet.</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Tip: Use the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-indigo-650 dark:text-indigo-400 font-mono font-semibold">Git Webhooks</code> simulation tool in Project Settings to push events!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {linkedGitEvents.map((evt) => (
                          <div key={evt.id} className="p-3 rounded-xl border border-gray-200/50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 text-xs flex gap-3 items-start">
                            <div className="mt-0.5 shrink-0">
                              {evt.type === 'PR' ? (
                                <GitPullRequest className={`h-4 w-4 ${evt.status === 'MERGED' ? 'text-purple-500' : 'text-green-500'}`} />
                              ) : (
                                <GitCommit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              )}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex justify-between gap-2 items-center">
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                  {evt.type === 'PR' ? `Pull Request: ${evt.refName}` : `Commit on ${evt.refName}`}
                                </span>
                                <span className="text-[9px] text-gray-400 shrink-0 font-medium">
                                  {new Date(evt.createdAt).toLocaleDateString() + ' ' + new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-semibold italic">"{evt.message}"</p>
                              <div className="flex justify-between items-center text-[9px] text-gray-400 font-semibold pt-0.5">
                                <span>by <span className="text-gray-500 dark:text-gray-300 font-bold">{evt.author}</span></span>
                                {evt.type === 'PR' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                                    evt.status === 'MERGED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' : 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                                  }`}>
                                    {evt.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sleek Task Card Component
interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onStatusChange: (status: 'TO_DO' | 'IN_PROGRESS' | 'DONE') => void;
  onDragStart?: (e: React.DragEvent) => void;
}

function TaskCard({ task, onEdit, onStatusChange, onDragStart }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white p-4 rounded-xl border border-gray-200/50 hover:shadow-md hover:border-indigo-100 cursor-grab active:cursor-grabbing transition duration-200 flex flex-col justify-between gap-3 group relative"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4
            onClick={onEdit}
            className="font-bold text-gray-800 text-sm hover:text-indigo-600 cursor-pointer transition line-clamp-2"
          >
            {task.title}
          </h4>
          <span
            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider shrink-0 ${
              task.priority === 'HIGH'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : task.priority === 'MEDIUM'
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'bg-gray-50 text-gray-500 border border-gray-100'
            }`}
          >
            {task.priority}
          </span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">{task.description || 'No description.'}</p>
        
        {/* Checklist Progress Bar */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[9px] text-gray-400">
              <span className="flex items-center gap-1 font-medium">
                <ListTodo className="h-3 w-3 text-indigo-500" />
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} Checklist
              </span>
              <span className="font-bold text-indigo-600">
                {Math.round(
                  (task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100
                )}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
              <div
                className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          {task.assignee ? (
            <>
              <div
                title={`Assignee: ${task.assignee.username}`}
                className="h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[9px] uppercase"
              >
                {task.assignee.username.substring(0, 2)}
              </div>
              <span className="font-semibold text-gray-600">{task.assignee.username}</span>
            </>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </div>

        {task.dueDate && (
          <span className="flex items-center gap-1 shrink-0 font-medium bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
            <Calendar className="h-3 w-3 text-gray-400" />
            {task.dueDate}
          </span>
        )}
      </div>

      <div className="flex justify-end gap-1 mt-1">
        <select
          title="Move Task Status"
          className="text-[9px] font-bold bg-gray-50 border border-gray-100 text-gray-500 rounded px-1.5 py-0.5 cursor-pointer outline-none focus:border-indigo-300"
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as any)}
        >
          <option value="TO_DO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
    </div>
  );
}
