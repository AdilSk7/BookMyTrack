# 🚆 BookMyTrack – Modern Railway Reservation System  

**BookMyTrack** is a full-stack, web-based **railway reservation system** that redefines the train ticket booking experience with a focus on **inclusivity, accessibility, and automation**.  
The project uses a **Node.js + Express.js backend** connected to **MongoDB**, and a **frontend built with HTML, CSS, and JavaScript** for an intuitive, responsive interface.  

This system improves upon traditional IRCTC-style platforms by supporting:  
✅ **Automatic lower-berth allocation for elderly passengers**,  
✅ **Gender-inclusive registration**, and  
✅ **Wheelchair-friendly seat reservation options**.  

---

## 🌟 Key Features  

👥 User Features

🧠 Smart automatic seat allocation

👵 Elderly priority seat assignment (Age ≥ 60)

👨‍👩‍👦 Family & Group booking support

♿ Wheelchair / accessibility support

🔐 Secure user login and JWT authentication

📑 Profile and booking history

💳 Payment simulation (dummy gateway)

🔍 PNR status lookup

📅 Train schedule simulation

📝 Feedback form

🛠️ Admin Features (NEW)

🔐 Admin login with JWT auth

📊 Admin Dashboard to monitor real-time booking stats

🔎 Filter/search reservations by PNR, UserID, Date, Status

👥 View complete passenger details

🚨 Protected routes using verifyAdmin middleware

📈 Today’s booking stats

---

## ⚙️ Project Architecture  

```
BookMyTrack/
│
├── backend/
│ ├── models/
│ │ ├── Payment.js
│ │ ├── Reservation.js   # Includes priorityScore, berthAllocated, seatLabel, etc.
│ │ └── User.js
│ │
│ ├── routes/
│ │ ├── auth.js
│ │ ├── reservation.js   # Smart seat allocation logic
│ │ ├── payment.js
│ │ ├── profile.js
│ │ ├── adminAuth.js     # NEW → JWT-based admin login
│ │ └── Admin.js         # NEW → Admin dashboard APIs (protected)
│ │
│ ├── server.js          # Admin protection added here
│ ├── .env
│ ├── package.json
│ └── package-lock.json
│
├── frontend/
│ ├── admin-dashboard/ (NEW)
│ │ ├── admin.html
│ │ ├── admin.css
│ │ ├── admin.js         # Uses admin token, protected API calls
│ │ ├── admin-login.html
│ │ └── admin-login.js
│ │
│ ├── other user pages:
│ │ ├── about.html / about.css
│ │ ├── booking.html / booking.css
│ │ ├── login.html / login.css
│ │ ├── schedule.html / schedule.css
│ │ ├── mybookings.html / mybookings.css
│ │ ├── payment.html / payment.css
│ │ ├── feedback.html / feedback.css
│ │ ├── pnr.html / pnr.css
│ │ ├── api.js, auth-guard.js
│ └── assets/ (images/icons)
│
└── README.md
```


---

## 🧠 System Design Overview  

### 🔹 Flow of Booking  

1. User logs in or registers (via `auth.js`).  
2. Selects source, destination, and passenger details.  
3. System checks available trains and berths.  
4. If passenger age ≥ 60, lower berths are automatically prioritized.  
5. Data stored in MongoDB via REST API (`reservation.js`).  
6. Payment simulated using the `payment.js` module.  
7. Confirmation displayed on `mybookings.html`.  

---

## 🧩 Tech Stack  

| Layer | Technology |
| --- | --- |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **User Authentication** | JSON Web Token (JWT), bcrypt (optional hashing) |
| **Admin Authentication** | JWT with role-based access (adminAuth.js)|
| **Architecture** | RESTful APIs + Modular Frontend + Protected Admin APIs |

---

## 🔒 Authentication Flow  

**User Authentication**

- Users register and login using the routes in auth.js.

- After login, a JWT token is issued and stored in localStorage.

- User-only pages (booking, payment, profile, etc.) are protected using auth-guard.js.

- JWT is validated on every API request to verify identity.

- Passwords can be hashed securely using bcrypt (if enabled).

**Admin Authentication (NEW)**

- Admin logs in through /api/admin/login, handled by adminAuth.js.

- A special Admin JWT token is issued containing { role: "admin" }.

- All admin dashboard APIs in Admin.js are protected using:
```
Authorization: Bearer <admin_token>
```

**Only valid admin tokens can access:**

- Booking statistics

- Reservation listings

- Admin-level filters and analytics

If the token expires or is invalid, the admin is automatically logged out.
---

## 🧠 Backend Overview  

**🔹 Elderly Priority Algorithm**

- Inside reservation.js, elderly passengers automatically get:

- Highest priorityScore

- Guaranteed lower berth if available

- Grouped allocation when traveling with guardians

- Sorted seat distribution (elderly → special needs → adults)

**🔹 Admin Authentication (NEW)**

- Admin login route:
```
POST /api/admin/login
```

- Protected admin APIs:
```
GET /api/admin/stats
GET /api/admin/reservations
```

- Protected using middleware:
```
Authorization: Bearer <admin_token>
```
**🔹 JWT Token Structure**

Role-based token → { role: "admin", email }

Default expiry: 8 hours

---

## 🖥️ Frontend Overview  

## 🔹 Admin Dashboard (NEW)

- **Loads stats:**
  - Total bookings
  - Active bookings
  - Cancelled bookings
  - Today's bookings

- **Advanced filters for reservations**
- **Clean UI with table view of all passengers**

**🔹 User Interface**

- Fully responsive layout

- Interactive seat selection

- Clean booking form design

- Smooth navigation & animations

---
## 🚀 Setup Instructions
**1️⃣ Clone the repository**
```
git clone https://github.com/Adilsk7/BookMyTrack.git
cd BookMyTrack
```
**2️⃣ Install backend dependencies**
```
cd backend
npm install
```

**3️⃣ Configure environment variables**

Create .env inside /backend:
```
MONGO_URI=your_mongodb_connection
PORT=5000

ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_secret
```
**4️⃣ Start backend**
```
node server.js
# or
npx nodemon server.js
```

**5️⃣ View frontend**

Open any .html file from frontend/ in your browser.
Admin login is at:
```
frontend/admin-login.html
```
---

## 🎯 Features Implemented  

- ✅ Login and Registration System  
- ✅ Automatic Seat Allocation  
- ✅ Group & Family Booking  
- ✅ Elderly Seat Prioritization (Age ≥ 60)  
- ✅ Profile Management  
- ✅ PNR & Schedule Simulation  
- ✅ Payment Workflow (Dummy Integration)  
- ✅ Feedback Form  

---

## 🧠 Future Enhancements  

📡 Real IRCTC API Integration

💸 Online payment gateway (Stripe / Razorpay)

🚆 Train availability engine

📍 Live tracking

📲 Convert to a Progressive Web App (PWA)

🧩 Complete Train & Coach Management from Admin Panel

🪑 Full Seat Map visualization

❌ Ticket cancellation & refund logic

---


## 🏁 Conclusion  

**BookMyTrack** is a step toward smarter, fairer, and more inclusive digital reservation systems.  
By blending **Node.js scalability**, **MongoDB flexibility**, and **accessible frontend design**,  
it demonstrates how thoughtful engineering can improve real-world passenger experiences.  
**BookMyTrack** showcases how modern web technologies can improve railway ticket booking through:
🎯 Automation,
🤝 Inclusivity,
♿ Accessibility, and
🧠 Smart engineering.

This project is a strong example of a real-world system built with
clean architecture, secure authentication, and user-friendly design.
