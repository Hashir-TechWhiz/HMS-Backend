/**
 * Authentication Testing Examples
 * 
 * This file demonstrates how to test the authentication endpoints
 * using JavaScript fetch API or curl commands
 */

// Example environment
const API_URL = "http://localhost:5000/api";

// ==========================================
// JAVASCRIPT FETCH EXAMPLES
// ==========================================

/**
 * Example 1: Login
 */
async function loginExample() {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: "admin@hotel.com",
                password: "admin123456",
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log("Login successful!");
            console.log("Token:", data.data.token);
            console.log("User:", data.data.user);
            return data.data.token;
        } else {
            console.error("Login failed:", data.message);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

/**
 * Example 2: Get current user profile
 */
async function getCurrentUserExample(token) {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (data.success) {
            console.log("User profile:", data.data);
        } else {
            console.error("Failed to get profile:", data.message);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

/**
 * Example 3: Create new user (Admin only)
 */
async function createUserExample(adminToken) {
    try {
        const response = await fetch(`${API_URL}/auth/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                name: "John Receptionist",
                email: "receptionist@hotel.com",
                password: "password123",
                role: "receptionist",
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log("User created successfully:", data.data);
        } else {
            console.error("Failed to create user:", data.message);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

/**
 * Example 4: Update current user
 */
async function updateProfileExample(token) {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: "Updated Name",
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log("Profile updated:", data.data);
        } else {
            console.error("Failed to update profile:", data.message);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// ==========================================
// CURL COMMAND EXAMPLES
// ==========================================

/*

1. LOGIN
========
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hotel.com",
    "password": "admin123456"
  }'

Save the token from the response for subsequent requests.


2. GET CURRENT USER
===================
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"


3. CREATE NEW USER (Admin only)
================================
curl -X POST http://localhost:5000/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Jane Receptionist",
    "email": "jane@hotel.com",
    "password": "password123",
    "role": "receptionist"
  }'


4. UPDATE PROFILE
=================
curl -X PATCH http://localhost:5000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Updated Name"
  }'


5. LOGOUT
=========
curl -X POST http://localhost:5000/api/auth/logout


6. ACCESS WITHOUT TOKEN (401 Error)
====================================
curl -X GET http://localhost:5000/api/auth/me


7. ACCESS WITH INVALID TOKEN (401 Error)
=========================================
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer invalid_token_here"


8. CREATE USER AS NON-ADMIN (403 Error)
========================================
# First login as non-admin user, then:
curl -X POST http://localhost:5000/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer NON_ADMIN_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test@hotel.com",
    "password": "password123",
    "role": "guest"
  }'

*/

// ==========================================
// POSTMAN COLLECTION STRUCTURE
// ==========================================

/*

Create a Postman Collection with these requests:

Folder: Authentication
├── Login (POST /api/auth/login)
├── Logout (POST /api/auth/logout)
├── Get Profile (GET /api/auth/me)
└── Update Profile (PATCH /api/auth/me)

Folder: User Management (Admin)
└── Create User (POST /api/auth/users)

Environment Variables:
- base_url: http://localhost:5000
- token: {{token}} (auto-set from login response)

*/

export {
    loginExample,
    getCurrentUserExample,
    createUserExample,
    updateProfileExample,
};

