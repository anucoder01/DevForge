import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner: User;
  members: User[];
  createdAt: string;
  inboxEmailAddress?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TO_DO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee: User | null;
  project: Project;
  dueDate: string | null;
  createdAt: string;
  subtasks?: Subtask[];
}

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  create: (data: { name: string; description: string }) => api.post<Project>('/projects', data),
  getById: (id: number) => api.get<Project>(`/projects/${id}`),
  update: (id: number, data: { name: string; description: string }) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  addMember: (projectId: number, userId: number) => api.post(`/projects/${projectId}/members`, { userId }),
  removeMember: (projectId: number, userId: number) => api.delete(`/projects/${projectId}/members/${userId}`),
  simulateEmail: (data: { to: string; from: string; subject: string; text: string }) => api.post('/webhooks/email-intake', data),
};

export const tasksApi = {
  getByProject: (projectId: number) => api.get<Task[]>(`/projects/${projectId}/tasks`),
  create: (
    projectId: number,
    data: {
      title: string;
      description: string;
      status?: string;
      priority?: string;
      assigneeId?: number | null;
      dueDate?: string | null;
    }
  ) => api.post<Task>(`/projects/${projectId}/tasks`, data),
  getById: (id: number) => api.get<Task>(`/tasks/${id}`),
  update: (
    id: number,
    data: {
      title: string;
      description: string;
      status: string;
      priority: string;
      assigneeId: number | null;
      dueDate?: string | null;
    }
  ) => api.put<Task>(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

export interface Comment {
  id: number;
  text: string;
  author: User;
  createdAt: string;
}

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
};

export const commentsApi = {
  getByTask: (taskId: number) => api.get<Comment[]>(`/tasks/${taskId}/comments`),
  create: (taskId: number, text: string) => api.post<Comment>(`/tasks/${taskId}/comments`, { text }),
  delete: (commentId: number) => api.delete(`/comments/${commentId}`),
};

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface ActivityLog {
  id: number;
  action: string;
  details: string;
  actor: User;
  createdAt: string;
}

export const subtasksApi = {
  getByTask: (taskId: number) => api.get<Subtask[]>(`/tasks/${taskId}/subtasks`),
  create: (taskId: number, title: string) => api.post<Subtask>(`/tasks/${taskId}/subtasks`, { title }),
  update: (subtaskId: number, data: { title: string; completed: boolean }) => api.put<Subtask>(`/subtasks/${subtaskId}`, data),
  delete: (subtaskId: number) => api.delete(`/subtasks/${subtaskId}`),
};

export const activityApi = {
  getByProject: (projectId: number) => api.get<ActivityLog[]>(`/projects/${projectId}/activity`),
};

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: () => api.get<Notification[]>('/notifications'),
  markRead: (id: number) => api.put<Notification>(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

export const profileApi = {
  update: (data: { email: string; currentPassword?: string; newPassword?: string }) => api.put('/users/profile', data),
};

export interface GitEvent {
  id: number;
  type: 'COMMIT' | 'PR';
  refName: string;
  author: string;
  url?: string;
  message: string;
  status?: 'OPEN' | 'MERGED' | 'CLOSED';
  createdAt: string;
}

export const gitApi = {
  getByTask: (taskId: number) => api.get<GitEvent[]>(`/tasks/${taskId}/git-events`),
  triggerMockWebhook: (data: { type: string; refName: string; author: string; message: string; url?: string }) => api.post('/git/webhook', data),
};

export interface BoardAutomationRule {
  id: number;
  name: string;
  triggerType: 'ALL_SUBTASKS_COMPLETED' | 'TASK_MOVED' | 'TASK_CREATED';
  triggerValue?: string;
  actionType: 'MOVE_TASK' | 'AUTO_ASSIGN';
  actionValue: string;
  active: boolean;
  createdAt: string;
}

export const automationsApi = {
  getByProject: (projectId: number) => api.get<BoardAutomationRule[]>(`/projects/${projectId}/automation-rules`),
  create: (projectId: number, data: Omit<BoardAutomationRule, 'id' | 'active' | 'createdAt'>) => api.post<BoardAutomationRule>(`/projects/${projectId}/automation-rules`, data),
  toggle: (ruleId: number) => api.put<BoardAutomationRule>(`/automation-rules/${ruleId}/toggle`),
  delete: (ruleId: number) => api.delete<{ message: string }>(`/automation-rules/${ruleId}`),
};

export const aiApi = {
  planSubtasks: (data: { title: string; description: string }) => api.post<string[]>('/ai/plan', data),
};

export default api;
