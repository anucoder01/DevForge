# DevForge Project Reference Guide

## 📌 Project Overview
DevForge is a modern, collaborative project management board designed to eliminate the performance bottlenecks, bloat, and fragmented tooling found in legacy systems like Jira, Trello, and Asana. It provides teams with real-time Kanban boards, interactive analytics, subtask checklists, and auditing logs, focusing on blazing-fast performance and seamless user experience.

---

## 🛠️ Tech Stack & Technologies Used

To fully understand and contribute to DevForge, you need to be familiar with its comprehensive tech stack:

### **Backend**
*   **Java 17**: The core programming language.
*   **Spring Boot 3**: Framework used to build the RESTful API and manage backend infrastructure.
*   **Spring Data JPA & Hibernate**: Used for ORM (Object-Relational Mapping). It leverages eager aggregates for fetching relationships (like tasks, subtasks, comments) in a highly optimized way to prevent N+1 queries.
*   **Spring Security & JWT**: Handles stateless user authentication, session storage, and authorization.
*   **PostgreSQL**: The relational database used to store all project, user, and task data.
*   **Docker Compose**: Used to easily spin up the PostgreSQL database container.

### **Frontend**
*   **React 19**: UI library for building the interactive single-page application.
*   **TypeScript**: Adds static typing to JavaScript for robust and maintainable frontend code.
*   **Vite**: An ultra-fast build tool and bundler replacing Webpack, providing instant Hot Module Replacement (HMR).
*   **Tailwind CSS**: Utility-first CSS framework used for styling, including custom responsive design tokens and dark mode.
*   **HTML5 Drag & Drop API**: Native, zero-dependency browser API used for dragging cards between Kanban columns for peak performance.

---

## 🏗️ Project Structure & Modules

The repository is divided into two main applications:

### 1. `backend/` (Spring Boot API)
The backend follows a classic layered Spring Boot architecture (`com.devforge.backend`):
*   **`controller/`**: Contains the REST API endpoints. This is where HTTP requests from the frontend are received and routed.
*   **`service/`**: Contains the core business logic. Controllers call services to process data, apply rules, and handle complex operations.
*   **`model/`**: Contains the JPA Entities (e.g., `TaskPriority.java`, `BoardAutomationRule.java`, `User`, `Project`, `Task`). These represent the database tables.
*   **`repository/`**: Interfaces extending `JpaRepository` (e.g., `UserRepository.java`) that provide CRUD operations and database querying capabilities without writing raw SQL.
*   **`security/`**: Configurations and filters for JWT generation, validation, and endpoint protection.
*   **`payload/`**: DTOs (Data Transfer Objects) for formatting data entering (requests) and leaving (responses) the APIs securely.

### 2. `frontend/` (React SPA)
The frontend is built with React and structured for scalability:
*   **`src/pages/`**: The top-level route components representing full screens (e.g., `Register.tsx`, `Settings.tsx`, `Dashboard`, `ProjectBoard`).
*   **`src/components/`**: Reusable UI elements (Buttons, Modals, Kanban Columns, Task Cards, Checklists).
*   **`src/context/`**: React Context API files used for global state management (e.g., User Authentication state, Theme/Dark Mode state).
*   **`src/services/`**: Functions that encapsulate the `fetch` or `axios` HTTP calls to the Spring Boot backend APIs.
*   **`src/assets/`**: Static files, images, and global stylesheets (`index.css` with Tailwind directives).

---

## 🎯 What to Study to Master DevForge

If you want to have a complete, expert-level understanding of this codebase, study these specific concepts:

1.  **Spring Data JPA Optimization**: Learn how DevForge uses eager cascades and fetching strategies to avoid the "N+1 query problem" when loading a task with its nested checklists and comments.
2.  **JWT Authentication Flow**: Understand how Spring Security filters intercept requests, validate the JWT token in the `Authorization` header, and set the security context. On the frontend, learn how the token is stored and attached to outgoing requests.
3.  **HTML5 Native Drag & Drop**: Study how the `onDragStart`, `onDragOver`, `onDrop` events are wired up in React components without using heavy third-party libraries like `react-beautiful-dnd`.
4.  **Tailwind Customization**: Look at `tailwind.config.js` to see how custom tokens and the dark-mode class strategy are implemented.
5.  **React 19 & TypeScript**: Review React Hooks (`useState`, `useEffect`, `useContext`) and how TypeScript interfaces enforce strict typing between the frontend models and backend DTOs.
6.  **Zero-Dependency SVG Charts**: Understand the math and logic behind how the real-time project analytics are generated directly via `<svg>` elements calculated from memory, bypassing heavy charting libraries.

---

## ❓ Frequently Asked Questions (FAQs)

**Q: How do I run the project locally?**
**A:** You need Java 17, Node.js 18+, and Docker.
1. Run `docker-compose up -d` in the root to start the Postgres database.
2. Navigate to `/backend` and run `.\mvnw.cmd spring-boot:run`.
3. Navigate to `/frontend`, run `npm install`, then `npm run dev`.

**Q: Why does DevForge use native HTML5 Drag and Drop instead of a library?**
**A:** Legacy systems suffer from bloat. By using the native API, DevForge reduces bundle size, improves runtime performance, and relies on standard browser capabilities rather than external dependencies.

**Q: How are analytics dashboards so fast?**
**A:** Instead of making separate fragmented network requests or loading massive charting libraries (like Chart.js or Recharts), DevForge computes analytics in real-time from the current board state and renders them instantly using custom Tailwind-styled native SVGs.

**Q: What is the plan for automations and AI?**
**A:** According to the roadmap (`features_checklist.md`), future integration plans include GitHub/GitLab PR tracking, custom Board Automation Rules, Email-to-Task pipelines, and Gemini AI integration for task planning, subtask generation, and estimation.

**Q: How is Dark Mode implemented?**
**A:** It uses a system-synced implementation that persists user preference in `localStorage` and toggles a `dark` class on the root HTML element, applying Tailwind's `dark:` utility variants across the app.
