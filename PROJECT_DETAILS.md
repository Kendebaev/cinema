# Cinema Booking System - Project Documentation

## 1. Project Overview
This is a **Cinema Ticket Booking System** built with **Node.js**, **Express**, and **MongoDB**. It allows users to browse movies, sort them by various criteria, search for movies, register/login, and book seats in different cinema rooms.

The application features **server-side rendering** using EJS templates and a **RESTful API** for seat management. It uses **session-based authentication** to protect booking operations.

---

## 2. Technology Stack
*   **Backend Runtime**: Node.js
*   **Web Framework**: Express.js
*   **Database**: MongoDB (Native Driver)
*   **Template Engine**: EJS (Embedded JavaScript)
*   **Authentication**: express-session + connect-mongo (Session Store) + bcrypt (Password Hashing)
*   **Styling**: Custom CSS (`public/style.css`)

---

## 3. Database Architecture (MongoDB)
The application connects to a MongoDB database named `cinema`.
**Connection String**: `mongodb://localhost:27017/cinema` (configurable via `.env`)

### Collections
1.  **`movies`**
    *   Stores movie details.
    *   **Schema**:
        ```json
        {
          "_id": ObjectId("..."),
          "title": "Inception",
          "genre": "Sci-Fi",
          "description": "...",
          "duration": 148,       // in minutes
          "releaseDate": "2010-07-16",
          "rating": 8.8
        }
        ```
    *   Initialized with 5 sample movies on first run.

2.  **`seats`**
    *   Stores cinema rooms and seat availability.
    *   **Schema**:
        ```json
        {
          "_id": ObjectId("..."),
          "roomId": "room1",     // room1 to room5
          "totalSeats": 10,
          "seats": [
            {
              "seatNumber": 1,
              "isAvailable": true, // false if booked
              "ownerName": ""      // name of booker
            },
            ...
          ]
        }
        ```
    *   Initialized with 5 rooms (10 seats each) on first run.

3.  **`users`**
    *   Stores registered user accounts.
    *   **Schema**:
        ```json
        {
          "_id": ObjectId("..."),
          "username": "john_doe",
          "password": "$2b$10$...", // Hashed with bcrypt
          "createdAt": ISODate("...")
        }
        ```

4.  **`contacts`**
    *   Stores messages submitted via the Contact Us form.
    *   **Schema**:
        ```json
        {
          "_id": ObjectId("..."),
          "name": "Jane User",
          "email": "jane@example.com",
          "message": "I love this cinema!",
          "createdAt": ISODate("...")
        }
        ```

5.  **`sessions`**
    *   Automatically managed by `connect-mongo`.
    *   Stores specific session data (cookie, userId, username) to maintain login state across requests.

---

## 4. File Structure & Responsibilities

```
express-post-form/
├── db/
│   └── database.js       # CORE: Database connection and logic
├── middleware/
│   └── authMiddleware.js # Middleware to protect routes
├── public/
│   └── style.css         # CSS for frontend
├── routes/
│   └── seats.js          # API Routes for seat booking
├── views/                # EJS Templates
│   ├── partials/         # Reusable View Components
│   │   └── header.ejs    # Navigation Bar (Partial)
│   ├── home.ejs          # Homepage
│   ├── item.ejs          # All Movies (Sorting)
│   ├── buy.ejs           # Booking Interface
│   ├── login.ejs         # Login Form
│   ├── register.ejs      # Register Form
│   ├── contact.ejs       # Contact Form
│   └── ...
├── server.js             # ENTRY POINT: App config, Routes, Auth
├── package.json          # Dependencies
└── .env                  # Environment variables
```

---

## 5. Core Components Analysis

### A. `server.js` - The Application Entry Point
This file sets up the Express server, connects to the database, configures sessions, and defines page routes.

**Key Features:**
*   **Initialization**: Waits for DB connection before starting server.
*   **Session Configuration**: Uses `MongoStore`.
*   **Authentication Routes**: Login, Register, Logout, and Delete Account.
*   **Global Middleware**: Injects `user` object into views.

### B. `db/database.js` - Data Access Layer
Contains all functions that interact with MongoDB.

**Key Functions:**
*   `getAllMoviesSorted(sortBy)`: Sorts movies.
*   `bookSeat(roomId, seatNumber, ownerName)`: Atomic update to book a seat.
*   `createUser(username, password)`: Handles user creation securely.
*   `saveContactMessage(contactData)`: **[NEW]** Saves contact form messages to MongoDB.
*   `deleteUser(userId)`: **[NEW]** Deletes a user document by ID.

### C. `routes/seats.js` - API & Protection
Defines JSON endpoints for the `buy.ejs` page to consume via fetch/AJAX.

---

## 6. Key Functionalities Explained

### 1. Movie Sorting
*   **Location**: `/movies` Page.
*   **Logic**: DB query uses `.sort()` based on user selection.

### 2. User Authentication Flow
1.  **Registration**: Hashes password with `bcrypt`.
2.  **Login**: Compares password hash, sets session.
3.  **Persistence**: Uses cookies and MongoDB session store.
4.  **Delete Account**:
    *   **Endpoint**: `POST /delete-account`.
    *   **Logic**: Authenticated user requests deletion -> DB removes user doc -> Session is destroyed -> Redirect to Home.

### 3. Contact Us
*   **Endpoint**: `POST /contact`.
*   **Logic**: Accepts name, email, message -> Validates input -> Saves to `contacts` collection in MongoDB.

### 4. Navigation Bar
*   **Implementation**: `views/partials/header.ejs`.
*   **Features**:
    *   Dynamic "Login/Register" or "Hello, [User]" links.
    *   **Dropdown Menu**: Logged-in users see a dropdown with "Logout" and "Delete Account" options.

---

## 7. How to Run
1.  **Start MongoDB**.
2.  **Install Dependencies**: `npm install`.
3.  **Run Server**: `node server.js`.
4.  **Access App**: `http://localhost:3000`.
