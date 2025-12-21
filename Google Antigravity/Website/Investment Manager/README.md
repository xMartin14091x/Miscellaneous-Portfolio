# InvestMan! - Smart Investment Planning

A comprehensive investment planning web application with Firebase authentication, real-time cloud sync, and multi-language support.

![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-7.x-purple)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 🔐 **Authentication** - Email, Phone OTP, Google Sign-In
- 💰 **Multi-Currency Accounts** - Track THB and USD with live exchange rate
- 📊 **Investment Planning** - Percentage-based allocations with priority accounts
- 📅 **DCA Scheduling** - Dollar Cost Averaging with completion tracking
- ☁️ **Cloud Sync** - Real-time sync across all devices via Firestore
- 📱 **Responsive Design** - Works on desktop and mobile
- 🌙 **Dark/Light Theme** - User preference saved
- 🌐 **Bilingual** - English and Thai (ภาษาไทย)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (for authentication & database)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/investment-manager.git
cd investment-manager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 📁 Project Structure

```
src/
├── main.jsx                    # App entry point
├── App.jsx                     # Root component with providers & routes
├── firebase.js                 # Firebase configuration & initialization
├── index.css                   # Global styles & CSS variables
├── translations.js             # i18n translations (EN/TH)
│
├── context/                    # React Context providers
│   ├── AuthContext.jsx         # Firebase authentication
│   ├── InvestmentContext.jsx   # Investment data & Firestore sync
│   ├── LanguageContext.jsx     # Language switching
│   └── ThemeContext.jsx        # Dark/Light theme
│
├── components/                 # Reusable components
│   ├── Navbar.jsx/.css         # Navigation bar
│   └── ProtectedRoute.jsx      # Auth guard for routes
│
└── pages/                      # Page components
    ├── Home.jsx/.css           # Landing page
    ├── LoginPage.jsx           # Login form
    ├── SignupPage.jsx          # Signup form
    ├── AuthPage.css            # Shared auth styles
    └── PlanningPage.jsx/.css   # Main investment UI
```

---

## 📄 File Documentation

### Entry Points

| File | Description |
|------|-------------|
| `main.jsx` | Renders the React app into the DOM |
| `App.jsx` | Sets up providers (Theme, Language, Auth, Investment) and routes |

### Firebase (`firebase.js`)

Initializes Firebase services:
- **Auth** - User authentication
- **Firestore** - Real-time database with offline persistence
- **Google Provider** - OAuth for Google Sign-In
- **reCAPTCHA** - Phone authentication verification

### Context Providers

| File | Purpose | Key Exports |
|------|---------|-------------|
| `AuthContext.jsx` | User authentication | `user`, `signIn`, `signUp`, `signInWithGoogle`, `signOut` |
| `InvestmentContext.jsx` | Investment data & sync | `accounts`, `investments`, `addAccount`, `addInvestment` |
| `LanguageContext.jsx` | i18n translations | `language`, `toggleLanguage`, `t` (translations) |
| `ThemeContext.jsx` | Dark/Light mode | `isDark`, `toggleTheme` |

### Pages

| File | Route | Description |
|------|-------|-------------|
| `Home.jsx` | `/` | Landing page with hero, features, CTA |
| `LoginPage.jsx` | `/login` | Login form (email/phone/Google) |
| `SignupPage.jsx` | `/signup` | Registration form |
| `PlanningPage.jsx` | `/planning` | Main investment planning interface (protected) |

---

## 🔒 Security

- ✅ API keys are in `.env` (gitignored)
- ✅ Firestore Security Rules enforce user-only access
- ✅ Authentication required for `/planning` route

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🛠️ Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## 📚 Tech Stack

- **React 18** - UI framework
- **Vite 7** - Build tool
- **Firebase** - Auth & Database
- **React Router 6** - Client-side routing
- **CSS Variables** - Theming system

---

## 📝 License

MIT License - feel free to use for your own projects!
