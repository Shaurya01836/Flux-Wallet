<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=4f46e5&height=250&section=header&text=Flux%20Wallet&fontSize=80&fontAlignY=35&desc=Master%20your%20money%20flow.&descAlignY=55&descAlign=60&animation=twinkling" />
  
  <p align="center">
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" /></a>
    <a href="https://spring.io/projects/spring-boot"><img src="https://img.shields.io/badge/Spring_Boot-4-6DB33F?style=for-the-badge&logo=spring" alt="Spring Boot" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql" alt="PostgreSQL" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status" />
  </p>

  <h3>Track, budget, and optimize your finances with a wallet built for clarity.</h3>
</div>

<br />

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About the Project
**Flux Wallet** is a modern, fast, and secure personal finance tracker designed to help you regain control over your money. Say goodbye to complex spreadsheets and fragmented tools—Flux provides you with an all-in-one intuitive dashboard to seamlessly log your daily transactions, monitor your balances, and visualize your spending habits through beautiful, interactive charts.

Built with a robust **React 19 + Vite** frontend and a powerful **Java 21 + Spring Boot** backend, Flux Wallet ensures high performance, enterprise-level security, and a beautiful user experience powered by **Tailwind CSS**.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| ⚡ **Instant Logging** | Add income and expenses in seconds. Quickly categorize your transactions to keep everything neatly organized automatically. |
| 📊 **Smart Analytics** | Visualize your spending habits with highly interactive, beautiful charts and total balance tracking using Recharts. |
| 🛡️ **Secure & Private** | Built with privacy in mind. Utilizes seamless **Google OAuth** integration for secure, password-less logins. |
| 💸 **Beautiful UI/UX** | Enjoy a brutalist-inspired, premium glassmorphism interface that is fully responsive and optimized for both desktop and mobile. |
| 📈 **Financial Insights** | View transaction history, filter by categories, and monitor your monthly financial growth instantly. |

---

## 🛠️ Tech Stack

### **Frontend (`/Client`)**
- **Framework:** React 19, Vite
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4
- **Data Visualization:** Recharts
- **Authentication:** Google OAuth (`@react-oauth/google`), JWT Decode
- **HTTP Client:** Axios
- **Icons:** React Icons

### **Backend (`/server`)**
- **Framework:** Spring Boot 4.0.0 (Java 21)
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA, Hibernate
- **Architecture:** MVC Pattern (Controllers, Services, Repositories, Entities, DTOs)
- **Utilities:** Lombok (Boilerplate reduction), ModelMapper (Object mapping)
- **Build Tool:** Maven

---

## 📂 Project Architecture

```text
flux-wallet/
├── Client/                 # React Frontend App
│   ├── src/
│   │   ├── assets/         # Static assets and visuals
│   │   ├── components/     # Reusable UI components (Modals, StatCards, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Full page views (Dashboard, LandingPage, MyWallet, etc.)
│   │   └── utils/          # Helper and formatting functions
│   └── package.json        
└── server/                 # Spring Boot Backend App
    ├── src/main/java/com/flux/server/
    │   ├── config/         # Security (CORS) and App configurations
    │   ├── controller/     # REST API Endpoints (Auth, Payment, User)
    │   ├── dto/            # Data Transfer Objects for API requests/responses
    │   ├── entity/         # Database Models (User, Payment, Budget)
    │   ├── repository/     # JPA Repositories for database queries
    │   └── service/        # Business Logic implementation
    └── pom.xml             
```

---

## 🏁 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Java JDK 21**
- **Maven**
- **PostgreSQL** Database

### Environment Variables

You will need to set up environment variables for both the Client and Server.

**Client (`/Client/.env`):**
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_API_BASE_URL=http://localhost:8080
```

**Server (`/server/src/main/resources/application.properties`):**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/flux_wallet
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Shaurya01836/Flux-Wallet.git
cd Flux-Wallet
```

#### 2. Setup the Backend
Open a terminal and navigate to the `server` directory:
```bash
cd server
./mvnw clean install
./mvnw spring-boot:run
```
*The Spring Boot server will start on `http://localhost:8080`.*

#### 3. Setup the Frontend
Open a new terminal and navigate to the `Client` directory:
```bash
cd Client
npm install
npm run dev
```
*The React frontend will be accessible at `http://localhost:5173`.*

---

## 📡 API Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | `POST` | Authenticate user via Google OAuth |
| `/api/users/me` | `GET` | Get current user profile details |
| `/api/payments` | `GET` | Get all transactions for a user |
| `/api/payments` | `POST` | Create a new transaction |
| `/api/payments/{id}` | `DELETE` | Delete a specific transaction |

*(Endpoints are subject to change based on active development)*

---

## 📸 Screenshots
> **Note:** Add screenshots of your application here once deployed.

| Dashboard | Landing Page |
|-----------|--------------|
| <img src="https://via.placeholder.com/600x350.png?text=Dashboard+Preview" alt="Dashboard" /> | <img src="https://via.placeholder.com/600x350.png?text=Landing+Page" alt="Landing Page" /> |

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/Shaurya01836/Flux-Wallet/issues) if you want to contribute.

## 📄 License
This project is open-source and free to use.

---
<div align="center">
  <p>Created with ❤️ by <b>Shaurya Upadhyay</b></p>
  <p>
    <a href="https://github.com/Shaurya01836">GitHub</a> •
    <a href="https://www.linkedin.com/in/this-is-shaurya-upadhyay">LinkedIn</a> •
    <a href="https://twitter.com/Shaurya01836">Twitter</a>
  </p>
</div>
