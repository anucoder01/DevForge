# DevForge 🛠️

DevForge is a modern, collaborative project management board designed to eliminate the performance bottlenecks, bloat, and fragmented tooling of legacy systems like Jira, Trello, and Asana. 

Built using a highly-optimized **Spring Boot 3 + JPA / Hibernate** backend paired with an interactive, responsive **React + TypeScript + Tailwind CSS** frontend, DevForge provides teams with real-time Kanban boards, interactive analytics, subtask checklists, and auditing logs.

---

## 🚀 Why DevForge is Better Than Existing Systems

| Pain Point in Legacy Systems (Jira/Trello) | DevForge Solution |
| :--- | :--- |
| **Bloated Charting & Loading Sluggishness:** Loading dashboards requires loading massive external charts packages, causing page delays. | **Zero-Dependency Native SVG Analytics:** Analytics are computed in real time from the memory state and rendered instantly via custom Tailwind-styled SVGs. |
| **Heavy API Latency & Fragmented Queries:** Opening a card makes separate network requests to fetch comments, subtasks, checklists, and assignees. | **Eager Aggregate Relationships:** Mapped eagerly at the JPA layer so opening/updating cards is instantly populated with comments and checklists. |
| **No In-Context Auditing Logs:** Tracking *who* changed *what* requires hunting through audit screens or email notifications. | **Inline Project Timeline:** Chronological event auditing logs are automatically generated on every create, move, comment, and checklist update. |
| **Lack of Contextual Toggles:** Toggling between dashboard statistics and task cards requires loading separate dashboards. | **In-Board Switcher Tabs:** Instantly flip between Kanban columns and the Analytics dashboard with zero page reloads. |

---

## 🛠️ Tech Stack & Architecture

### Backend:
- **Java 17 & Spring Boot 3**
- **Spring Security & JWT Authentication** (Secure stateless session storage)
- **Spring Data JPA** (Eager cascades for subtask checklists and comments)
- **PostgreSQL Database**

### Frontend:
- **React 19 & TypeScript**
- **Vite** (Ultra-fast HMR bundler)
- **Tailwind CSS** (Custom responsive design tokens and dark mode styling)
- **HTML5 Drag & Drop API** (Native, dependency-free card transitions)

---

## 🚀 Getting Started

### Prerequisites:
- **Java 17** Installed
- **Node.js** (v18+) Installed
- **Docker Desktop** (For PostgreSQL container)

### Step 1: Initialize Database
Run Docker Compose in the root folder to pull and launch the PostgreSQL container:
```bash
docker-compose up -d
```

### Step 2: Run Spring Boot Backend
Navigate to the backend directory and run the maven wrapper:
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
The server will run on `http://localhost:8080` with automatic DDL schema updates.

### Step 3: Run React Frontend
Navigate to the frontend directory, install dependencies, and start Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` on your browser to sign up and start project boards!

---

## 🗺️ Roadmap & Features Expansion
Check out our future product timeline and mark off active feature implementations inside the expansion roadmap:
👉 [Expansion Features Checklist](./features_checklist.md)
