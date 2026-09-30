# NexusLMS

## Description

Managing academic operations across multiple schools is often fragmented: different tools for courses, grading, assignments, and user management, with no unified system. **NexusLMS** solves this by providing a centralized, multi-tenant Learning Management System (LMS) where each school operates in its own isolated environment (subdomain/tenant). Admins, teachers, and students each get a tailored experience with role-appropriate access, all under one platform.

---

## Features

- **Multi-Tenant Architecture**: each school gets its own tenant/subdomain with isolated data
- **Role-Based Access Control (RBAC)**: separate dashboards and permissions for Admins, Teachers, and Students
- **Course Management**: create, organize, and publish structured learning content
- **Assignments & File Uploads**: students submit work digitally; teachers review and grade submissions
- **Tests & Quizzes**: graded assessments with auto-grading for multiple-choice questions
- **Gradebook**: centralized tracking of student scores and progress across all courses

---

## Tech Stack

- **Frontend:** React (Vite), Vanilla CSS
- **Backend:** Spring Boot, Spring Security (JWT)
- **Database:** MongoDB
- **File storage:** Cloudinary
- **Testing:** JUnit
- **Containerization:** Docker (in progress)

---

## Getting Started

### Prerequisites

- Java 24 or newer
- Maven
- Node.js 18 or newer
- A MongoDB database (local install or a MongoDB Atlas cluster)
- A Cloudinary account (for file uploads)

### 1. Clone the repository

```bash
git clone https://github.com/coding-jewel/NexusLMS.git
cd NexusLMS
```

### 2. Configure the backend

Secrets are not committed to the repository. Create your own config file from the example:

```bash
cd engine/src/main/resources
cp application.properties.example application.properties
```

Open `application.properties` and fill in your own values:

| Setting | What to put |
|---|---|
| MongoDB URI | Your MongoDB connection string |
| JWT secret | A long, random string |
| JWT expiration | `86400000` (24 hours, in milliseconds) |
| Cloudinary cloud name, API key, API secret | From your Cloudinary dashboard |

### 3. Run the backend

```bash
cd engine
./mvnw spring-boot:run
```

The API starts at `http://localhost:8080`.

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

---

## Running Tests

```bash
cd engine
./mvnw test
```

---

## Docker

Docker support is still being set up. Until it is ready, run the backend and frontend manually as described above.




## Author

Essien Eno-Obong Chizitelu