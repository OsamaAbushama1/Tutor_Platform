# EduBridge

EduBridge is a web platform designed to connect students with expert teachers across Egypt. It facilitates booking educational sessions, managing teacher schedules, and providing personalized learning experiences. The platform supports multilingual interfaces (English and Arabic) and includes robust user authentication, booking, and notification systems.

This repository contains both the **frontend** and **backend** codebases for the EduBridge platform.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features
- **User Authentication**:
  - Register and login with email and phone number validation.
  - Password reset with email-based recovery.
  - Profile management with image upload (JPEG, PNG, GIF) and cropping.
- **Teacher Management**:
  - Admins can add, edit, or delete teachers.
  - Manage teacher schedules, subjects, grades, and pricing.
  - Cancel lessons with automated notifications to affected students.
- **Booking System**:
  - Students can book sessions by selecting dates, times, and locations.
  - View and manage bookings with status updates (Pending, Confirmed, Cancelled, Modified).
  - Waiting list for fully booked sessions.
- **Notifications**:
  - Real-time notifications for booking updates and cancellations.
  - Admin ability to send notifications to all or specific users.
- **Multilingual Support**:
  - Interface available in English and Arabic using i18next.
- **Admin Dashboard**:
  - Manage users, teachers, bookings, and platform statistics.
  - Filter and search functionality for efficient management.
- **Teacher Profiles**:
  - Detailed teacher information including ratings, subjects, and promotional videos.
  - Top-rated teacher badge for high-performing educators.

## Tech Stack
### Frontend
- **Framework**: [React.js](https://reactjs.org/)
- **State Management**: [Context API](https://reactjs.org/docs/context.html)
- **Styling**: [Bootstrap](https://getbootstrap.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) for API requests
- **Localization**: [i18next](https://www.i18next.com/) for multilingual support
- **Image Handling**: Support for JPEG, PNG, GIF uploads with cropping
- **Routing**: [React Router](https://reactrouter.com/)

### Backend
- **Framework**: [Django](https://www.djangoproject.com/) with [Django REST Framework](https://www.django-rest-framework.org/)
- **Database**: [SQLite](https://www.sqlite.org/) for development
- **Authentication**: [JWT](https://jwt.io/) for secure user sessions
- **API**: RESTful API for communication with the frontend
- **File Storage**: Local storage or cloud-based (e.g., AWS S3) for profile images and videos
- **Notifications**: Email-based notifications using Django's email system

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Python](https://www.python.org/) (v3.8 or higher)
- [Git](https://git-scm.com/)

### Frontend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/edubridge.git
   cd edubridge/frontend


Install dependencies:npm install

oryarn install


Create a .env file in the frontend directory and add environment variables:REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_BASE_URL=http://localhost:3000


Start the development server:
npm start

or yarn start


Access the frontend at http://localhost:3000.

### Backend Setup

Navigate to the backend directory:
cd edubridge/backend


Create and activate a virtual environment:python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate


Install dependencies:pip install -r requirements.txt


Create a .env file in the backend directory and add environment variables:SECRET_KEY=your_django_secret_key
DATABASE_URL=sqlite:///db.sqlite3
EMAIL_HOST=smtp.your-email-service.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email_user
EMAIL_HOST_PASSWORD=your_email_password


Run database migrations:python manage.py migrate


Start the Django development server:python manage.py runserver


The API will be available at http://localhost:8000/api.


Usage

User Registration/Login:
Navigate to /register or /login to create an account or sign in.
Passwords must meet criteria (8+ characters, uppercase, lowercase, number, special character).


Browsing Teachers:
Visit /teachers to view available teachers, filter by subject, governorate, or grade.
Click "View Details" to see teacher profiles and book sessions.


Booking a Session:
Select a teacher, choose a date, time, and place, then click "Pay Now" to confirm.
View bookings under /bookings.


Admin Dashboard:
Admins can access /admin to manage teachers, bookings, users, and notifications.
Use filters and search to manage data efficiently.


Notifications:
Check /notifications for booking updates or messages.
Admins can send notifications to users via the dashboard.



For any issues or questions, please open an issue on GitHub or contact us at osamaabushama1@gmail.com.```
