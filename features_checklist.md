# DevForge Features Expansion Checklist

Use this checklist to track the development of features that will make DevForge a top-tier project management tool.

---

## 🛠️ Base Project Features (Completed)
- [x] Secure JWT-Based Authentication (Sign Up, Log In, Log Out)
- [x] Projects Dashboard (Create, read, and delete projects)
- [x] Interactive Kanban Board (To Do, In Progress, Done columns)
- [x] Task Management (Create, edit, delete tasks with Assignee, Priority, Due Date)
- [x] Checklist / Subtasks (Add checklist progress bars to task cards)
- [x] Real-time Search & Filters (Filter tasks by title, priority, and assignee)
- [x] Contextual Commenting (Add discussion comments inside task details modal)
- [x] Project Activity Timeline (Live chronological log of project edits)
- [x] Project Analytics & Custom SVG Charts (Status distributions and collaborator workload charts)
- [x] Interactive HTML5 Drag & Drop (Drag cards between columns)
- [x] Real-time Notifications Bell (Unread notifications counts and mark-read controls)
- [x] User Account Settings (Email updates and secure password resets)
- [x] System-synced Dark Mode (Light/dark styles persisting in local storage)

---

## 🚀 Future Features Roadmap (15 Features)

### 🔗 Integrations & Automations
- [x] **1. GitHub / GitLab Repository Integration**
  - Connect branches, commits, and Pull Requests directly to task cards using task reference IDs (e.g., auto-move a task to "Done" when its PR is merged).
- [x] **2. Customizable Board Automation Rules**
  - No-code rules builder (e.g., "When all subtasks are complete, transition card to Done" or "When task is moved to In Progress, auto-assign to the actor").
- [ ] **3. Email-to-Task Ingestion Pipeline**
  - Generate new task cards automatically from emails sent to a project's unique intake inbox address.

### 🧠 Collaboration & Productivity
- [ ] **4. AI Task Planner & Estimator (Gemini Integration)**
  - Integrate Gemini to auto-generate subtask checklists, draft task descriptions, and estimate time/points based on historical velocity.
- [ ] **5. In-App Chat Room / Channels**
  - Contextual Slack-like channels inside each project board for team discussions, directly alongside the task cards.
- [ ] **6. Integrated Project Wiki & Markdown Docs**
  - A persistent collaborative workspace within each project for product requirement documents, API specifications, and team onboarding wikis.

### 📊 Project Tracking & Resource Management
- [ ] **7. Interactive Gantt Chart / Project Timeline**
  - A visual Gantt timeline tab to chart task start/end dates, plan milestones, and adjust scheduling on the fly.
- [ ] **8. Built-in Time Tracking & Timesheets**
  - Quick-start timers directly on task cards that log work hours and generate weekly timesheet CSV exports.
- [ ] **9. Task Dependency Mapping**
  - Map explicit connections between cards (e.g., "Blocks", "Blocked by", "Duplicate of", "Related to") with visual block warnings.
- [ ] **10. Assignee Capacity Planner & Workload Estimator**
  - Alert indicators highlighting team members overallocated with tasks beyond standard weekly hour thresholds.
- [ ] **11. Detailed Sprint Burn-down & Velocity Reports**
  - Advanced analytics charts measuring team delivery performance, points completed per sprint, and scope creep indicators.

### ⚙️ Extensibility & Security
- [ ] **12. Custom Fields Builder**
  - Let project owners create custom metadata fields (e.g. number point inputs, custom select dropdowns, labels, and URL references) on task cards.
- [ ] **13. Client / Guest Portal Access**
  - Share-restricted view portals allowing external stakeholders to follow progress updates without exposing internal discussions or repositories.
- [ ] **14. External Calendar Integration (Google Cal / iCal)**
  - Export task deadlines to external calendar clients via personalized secure iCal subscription links.
- [ ] **15. Offline-First PWA Mode (Progressive Web App)**
  - Add Service Workers and local caching so the board remains functional offline, queueing card movements to sync when online connection returns.
