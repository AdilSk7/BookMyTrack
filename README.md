# 🚆 BookMyTrack – Modern Railway Reservation System  

**BookMyTrack** is a full-stack, web-based **railway reservation system** that redefines the train ticket booking experience with a focus on **inclusivity, accessibility, and automation**.  
The project uses a **Node.js + Express.js backend** connected to **MongoDB**, and a **frontend built with HTML, CSS, and JavaScript** for an intuitive, responsive interface.  

This system improves upon traditional IRCTC-style platforms by supporting:  
✅ **Automatic lower-berth allocation for elderly passengers**,  
✅ **Gender-inclusive registration**, and  
✅ **Wheelchair-friendly seat reservation options**.  

---

## 🌟 Key Features  

- 🧠 Smart automatic seat allocation (priority for elderly passengers).  
- 👨‍👩‍👧‍👦 Family and group booking support.  
- ♿ Wheelchair and accessibility preferences.  
- 💳 Payment simulation and booking confirmation.  
- 🔐 User login, authentication, and profile management.  
- 📅 Schedule and PNR viewing options.  

---

## ⚙️ Project Architecture  

```
BookMyTrack/
│
├── backend/
│ ├── models/ # Mongoose models (User, Reservation, Payment)
│ │ ├── Payment.js
│ │ ├── Reservation.js
│ │ └── User.js
│ │
│ ├── routes/ # Express route handlers
│ │ ├── auth.js # User authentication and registration
│ │ ├── payment.js # Payment route logic
│ │ ├── profile.js # User profile and data fetch
│ │ └── reservation.js # Seat booking and reservation API
│ │
│ ├── server.js # Main Express server entry point
│ ├── package.json
│ └── package-lock.json
│
├── frontend/
│ ├── about.html / about.css
│ ├── booking.html / reservation.css
│ ├── contact.html / contact.css
│ ├── fare.html / fare.css
│ ├── feedback.html / feedback.css
│ ├── login.html / login.css
│ ├── registration.html / registration.css
│ ├── schedule.html / schedule.css
│ ├── mybookings.html / mybookings.css
│ ├── profile.html / profile.css
│ ├── payment.html / payment.css
│ ├── pnr.html / pnr.css
│ ├── index.html / style.css # Homepage and global styling
│ ├── api.js, auth-guard.js # JS logic for API communication and route protection
│ └── assets/ # Images (e.g., train.jpg)
│
├── README.md # Project documentation
└── package.json # Root dependencies
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
| **Authentication** | JSON Web Token (JWT) |
| **Architecture** | RESTful APIs + Modular Frontend |

---

## 🔒 Authentication Flow  

- Users register and login through `auth.js` routes.  
- JWT tokens are issued and validated on protected pages using `auth-guard.js`.  
- Passwords stored securely using **bcrypt hashing** (if implemented).  

---

## 🧠 Backend Overview  

- **server.js:** Initializes Express, sets up middleware, connects to MongoDB.  
- **routes/**: Contains API endpoints for authentication, reservation, payment, and profile.  
- **models/**: Defines database schema for users, bookings, and payments.  

---

## 🖥️ Frontend Overview  

- Modular HTML pages with linked CSS and JS.  
- JavaScript handles seat selection, booking logic, and input validation.  
- Dynamic seat allocation logic for elderly and group bookings integrated with backend APIs.  

---

## 🎯 Features Implemented  

- ✅ User Registration & Login
- ✅ JWT Authentication
- ✅ Smart Seat Allocation
- ✅ Elderly Passenger Lower-Berth Priority
- ✅ Family & Group Booking
- ✅ Accessibility Preferences
- ✅ Train Schedule & Fare Enquiry
- ✅ PNR Generation & Viewing
- ✅ Booking Cancellation
- ✅ Payment/UPI Simulation
- ✅ User Profile Management
- ✅ Feedback & Contact Management
- ✅ Admin Dashboard
- ✅ Reservation Management
- ✅ User Management
- ✅ Train & Route Management
- ✅ Booking Status Management
- ✅ Dashboard Analytics

---

## 🚀 Future Enhancements

- Integrate real-time train schedules and availability APIs.
- Integrate a production payment gateway such as Razorpay or Stripe.
- Implement real-time PNR status tracking.
- Add email/SMS notifications for booking confirmations and cancellations.
- Develop a Progressive Web App (PWA) for mobile users.  

---

## 🏁 Conclusion  

**BookMyTrack** is a step toward smarter, fairer, and more inclusive digital reservation systems.  
By blending **Node.js scalability**, **MongoDB flexibility**, and **accessible frontend design**,  
it demonstrates how thoughtful engineering can improve real-world passenger experiences.  

