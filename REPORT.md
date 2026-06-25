# 🎬 Cinema Ticket Booking & Movie Management System
## Industry Practice Project Report

---

## 1. Project Overview
This project is a fully-featured, production-ready **Cinema Ticket Booking and Movie Management System** built with a modular MVC architecture using **Node.js (Express)**, **MongoDB**, and **EJS templates** for the front-end. 

The application solves the real-world problem of digital booking management for cinema administrators and ticket buyers. It features:
*   **User Authentication & Security**: JWT-based session-less authentication with passwords hashed via `bcrypt` and inputs validated via `Joi`.
*   **Cinema Booking System**: Interactive, real-time seat mapping across multiple cinema rooms (Room 1 to Room 5) preventing double-booking.
*   **Movie Resource CRUD**: Full RESTful CRUD endpoints for movie management (`/resource`) supporting keyword searching, genre-filtering, and page/limit-based pagination.
*   **User Dashboard**: Dynamic user profile page presenting user info and active ticket bookings with cancel options.
*   **Observation & Metrics**: Exported Prometheus metrics (`/metrics`) for CPU, Memory, and application telemetry.
*   **Premium UI**: Responsive layout featuring CSS-variable powered **Light/Dark Mode** saved in the user's browser, along with recent searches stored in **Local Storage**.

---

## 2. Technology Stack
*   **Backend Runtime**: Node.js (v20+)
*   **Web Framework**: Express.js (v5)
*   **Database**: MongoDB (Native Driver)
*   **Template Engine**: EJS (Embedded JavaScript)
*   **Authentication**: JSON Web Tokens (`jsonwebtoken`) + Cookie storage + `bcrypt`
*   **Input Validation**: `Joi`
*   **Monitoring**: `prom-client` (Prometheus Metrics)
*   **Styling**: Responsive Vanilla CSS supporting variables and light/dark theme toggles

---

## 3. Database Architecture (MongoDB)
The application uses 4 collections in a MongoDB database named `cinema`.

### A. `users`
Stores authenticated user accounts.
*   `username` (String, unique): User's handle.
*   `email` (String, unique): Lowercased, verified email.
*   `phone` (String): Contact phone number.
*   `password` (String): Securely hashed with bcrypt (salt rounds = 10).
*   `role` (String): Role of the user (`user` or `admin`).
*   `createdAt` (Date): Registration timestamp.

### B. `movies` (The CRUD Resource)
Stores details of movies available for screening.
*   `title` (String): Title of the movie.
*   `genre` (String): Genre category.
*   `duration` (Number): Runtime in minutes.
*   `releaseDate` (String): Date of release (YYYY-MM-DD).
*   `rating` (Number): Rating out of 10.
*   `description` (String): Summary of the film.
*   `createdAt` (Date): Creation timestamp.

### C. `seats`
Manages cinema room capacities and seating grids.
*   `roomId` (String, unique): ID (e.g. `room1`).
*   `roomNumber` (Number): E.g., `1`.
*   `totalSeats` (Number): Total capacity (e.g., `10`).
*   `seats` (Array of Objects): Each seat has:
    *   `seatNumber` (Number)
    *   `isAvailable` (Boolean)
    *   `ownerName` (String): Booker's name.
    *   `userId` (ObjectId): References the booker's user account.

### D. `contacts`
Stores support requests.
*   `name`, `email`, `message`, `createdAt`.

---

## 4. Setup Instructions

### Prerequisites
*   Node.js (v20 or higher)
*   MongoDB (running locally on port 27017 or a MongoDB Atlas URI)

### Local Deployment
1.  **Clone/Extract the project directory** and navigate into it:
    ```bash
    cd express-post-form
    ```
2.  **Install the dependencies**:
    ```bash
    npm install
    ```
3.  **Configure environment variables**:
    Copy the example file to `.env`:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in your variables:
    ```ini
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/cinema
    JWT_SECRET=your_super_secret_jwt_key
    ```
4.  **Start the server**:
    ```bash
    npm start
    ```
    The application will launch on `http://localhost:3000`.

---

## 5. API Documentation

### Authentication & Profiles
#### 1. `POST /register`
Registers a new user and returns a JWT.
*   **Body (JSON)**:
    ```json
    {
      "username": "johndoe",
      "email": "john@example.com",
      "phone": "+77071234567",
      "password": "Password123",
      "confirmPassword": "Password123"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Registration successful!",
      "token": "eyJhbGciOi...",
      "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "role": "user" }
    }
    ```

#### 2. `POST /login`
Authenticates a user and issues a JWT token.
*   **Body (JSON)**:
    ```json
    {
      "username": "johndoe",
      "password": "Password123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Login successful!",
      "token": "eyJhbGciOi...",
      "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "role": "user" }
    }
    ```

#### 3. `GET /profile`
Retrieves the profile and active bookings for the logged-in user.
*   **Headers**: `Authorization: Bearer <JWT_TOKEN>` (or cookie `token`)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "phone": "+77071234567", "role": "user" },
      "bookings": [
        { "roomId": "room1", "roomNumber": 1, "seatNumber": 5, "ownerName": "John Doe" }
      ]
    }
    ```

---

### Resource CRUD & Pagination (`/resource`)
#### 1. `POST /resource` (Admin Only)
Creates a new movie resource.
*   **Headers**: `Authorization: Bearer <JWT_TOKEN_FOR_ADMIN>`
*   **Body (JSON)**:
    ```json
    {
      "title": "Interstellar",
      "genre": "Sci-Fi",
      "duration": 169,
      "releaseDate": "2014-11-07",
      "rating": 8.6,
      "description": "A team of explorers travel through a wormhole in search of a new home."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Resource created successfully",
      "data": { "_id": "...", "title": "Interstellar", "genre": "Sci-Fi" }
    }
    ```

#### 2. `GET /resource` (Public)
Lists movie resources with keyword search, genre filtering, and page/limit pagination.
*   **Parameters**:
    *   `search`: Search string (searches title, genre, and description)
    *   `genre`: Filters by exact genre (case-insensitive)
    *   `rating`: Filters movies with rating greater than or equal to this
    *   `page`: Page index (default: `1`)
    *   `limit`: Items per page (default: `10`)
*   **Example Query**: `GET /resource?search=space&genre=Sci-Fi&page=1&limit=5`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "_id": "...", "title": "Interstellar", "genre": "Sci-Fi", "rating": 8.6 }
      ],
      "pagination": {
        "totalItems": 1,
        "totalPages": 1,
        "currentPage": 1,
        "limit": 5
      }
    }
    ```

#### 3. `PUT /resource/:id` (Admin Only)
Updates a movie resource by ID.
*   **Headers**: `Authorization: Bearer <JWT_TOKEN_FOR_ADMIN>`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Resource updated successfully",
      "data": { ... }
    }
    ```

#### 4. `DELETE /resource/:id` (Admin Only)
Deletes a movie resource by ID.
*   **Headers**: `Authorization: Bearer <JWT_TOKEN_FOR_ADMIN>`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Resource deleted successfully"
    }
    ```

---

## 6. Screenshots of Key Features
*(Please replace the placeholders below with actual screenshots of your application)*

#### 1. Home Page / Movie Browsing
![Home Page Placeholder](https://via.placeholder.com/800x450.png?text=Home+Page+-+Movie+List)

#### 2. Registration Page (with Email, Phone & Password Complexity Validation)
![Register Page Placeholder](https://via.placeholder.com/800x450.png?text=Registration+Form+Validation)

#### 3. User Dashboard / Profile Page (showing details and ticket bookings)
![Profile Page Dashboard](https://via.placeholder.com/800x450.png?text=User+Profile+Dashboard)

#### 4. Light & Dark Mode Toggle Demonstration
![Theme Toggle Demonstration](https://via.placeholder.com/800x450.png?text=Light+and+Dark+Mode+Skins)

---

## 7. Deployment Link
*   **Deployed URL**: `[Insert your hosting deployment link here]`
*   **GitHub Repository**: `[Insert repository link if applicable]`
