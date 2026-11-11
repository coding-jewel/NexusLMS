# NexusLMS

> A production-ready, multi-tenant Learning Management System (LMS) designed for modern schools.

## 📖 Overview

Managing academic operations across multiple schools is often fragmented, requiring different tools for courses, grading, and user management. **NexusLMS** solves this by providing a centralized, multi-tenant platform where each school operates in its own isolated environment via dynamic subdomains (e.g., `nexus.nexuslms.com`). 

Admins, teachers, and students each get a tailored, secure experience under one unified architecture.

---

## ✨ Key Features

### 🏢 Multi-Tenancy & Security
- **Isolated Environments:** Every school gets its own subdomain. Data is strictly filtered by `tenantId`, ensuring zero data bleed between schools.
- **Role-Based Access Control (RBAC):** Separate, secure dashboards for Admins, Teachers, and Students.
- **Real Email Verification:** Secure onboarding flows for school registration and password resets using SMTP.
- **JWT Authentication:** Stateless, secure API authentication.

### 📚 Academic Management
- **Advanced Exam Engine:** Auto-grading for Multiple Choice Questions (MCQs). Server-side timers ensure exams auto-submit even if a student closes their browser.
- **Customizable Gradebook:** Toggle between Raw Points or Weighted Categories (e.g., 30% Assignments, 70% Exams). Includes one-click CSV export.
- **Assignments & Uploads:** Students submit work digitally; teachers review and grade submissions with the original assignment instructions visible side-by-side.

### 🛡️ Data Integrity & Performance
- **Race Condition Protection:** Implemented MongoDB partial compound unique indexes to physically prevent duplicate submissions and grade records.
- **Optimized Queries:** Extensive use of compound indexes on foreign keys (e.g., `studentId`, `courseId`, `tenantId`) to ensure high performance for dashboards and gradebooks.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Vanilla CSS, React Router
- **Backend:** Spring Boot (Java 24), Spring Security (JWT)
- **Database:** MongoDB Atlas
- **File Storage:** Cloudinary
- **Testing:** JUnit
- **DevOps:** Docker, Docker Compose, Nginx (Reverse Proxy)

---

## 🚀 Getting Started

### Prerequisites
- **Docker Desktop** (Recommended for the easiest setup)
- *For local development without Docker:* Java 24, Maven, Node.js 18+, MongoDB Atlas account, Cloudinary account.

### Option 1: Run with Docker (Recommended)
The entire application is containerized. The React frontend is served by an Nginx container which acts as a reverse proxy, routing `/api` requests securely to the Spring Boot backend.

1. Ensure Docker Desktop is open and running.
2. Open your terminal in the root directory of this project and run:
   ```bash
   docker-compose up --build
   ```
3. Access the app in your browser at **`http://localhost`**
4. **Test Multi-Tenancy:** Register a school, and you will be automatically redirected to your custom subdomain (e.g., `http://yourschool.localhost`).

### Option 2: Local Development (Without Docker)

**1. Configure the Backend**
```bash
cd engine/src/main/resources
cp application.properties.example application.properties
```
Fill in your MongoDB URI, JWT secret, and Cloudinary credentials in the new file.

**2. Run the Backend**
```bash
cd engine
./mvnw spring-boot:run
```
The API will start on `http://localhost:8080`.

**3. Run the Frontend**
```bash
cd frontend
npm install
npm run dev
```
The app will open on `http://localhost:5173`.

---

## 🧪 Running Tests

```bash
cd engine
./mvnw test
```

---

## 👨‍💻 Author

**Essien Eno-Obong Chizitelu**