# InvestMan! - Codebase Documentation

A comprehensive investment planning web application with Firebase authentication, real-time cloud sync, and multi-language support.

---

## 🎯 What This App Does

InvestMan! helps investors:
1. **Track currency accounts** (THB & USD) with automatic exchange rate conversion
2. **Plan investment allocations** as percentages of total funds
3. **Schedule DCA (Dollar Cost Averaging)** with date tracking and completion checkboxes
4. **Sync data across devices** via Firebase Firestore (auto-save, real-time)
5. **Authenticate** via Email/Password, Phone OTP, or Google Sign-In

---

## 📁 Project Structure

```
src/
├── main.jsx                    # App entry point - renders App into DOM
├── App.jsx                     # Root component - providers & routing
├── App.css                     # App-level styles
├── index.css                   # Global CSS variables & base styles
├── firebase.js                 # Firebase config (Auth + Firestore)
├── translations.js             # i18n translations (English/Thai)
│
├── context/                    # React Context providers
│   ├── AuthContext.jsx         # Authentication (Firebase Auth)
│   ├── InvestmentContext.jsx   # Investment data + Firestore sync
│   ├── LanguageContext.jsx     # Language switching (EN/TH)
│   └── ThemeContext.jsx        # Dark/Light theme toggle
│
├── components/                 # Reusable UI components
│   ├── Navbar.jsx              # Top navigation bar
│   ├── Navbar.css              # Navbar styles
│   └── ProtectedRoute.jsx      # Auth guard for routes
│
├── pages/                      # Page components
│   ├── Home.jsx                # Landing page
│   ├── Home.css                # Landing page styles
│   ├── LoginPage.jsx           # Login form (Email/Phone/Google)
│   ├── SignupPage.jsx          # Signup form
│   ├── AuthPage.css            # Shared auth page styles
│   ├── PlanningPage.jsx        # Main investment planning UI
│   └── PlanningPage.css        # Planning page styles
│
└── assets/                     # Static assets (images, icons)
```

---

## 📄 File-by-File Documentation

### Entry Points

---

#### `main.jsx`
**Purpose:** Application entry point

```javascript
// Renders the React app into the DOM root element
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

#### `App.jsx`
**Purpose:** Root component that sets up providers and routes

**Provider Order (outermost to innermost):**
1. `BrowserRouter` - Enables routing
2. `ThemeProvider` - Dark/light mode
3. `LanguageProvider` - i18n translations
4. `AuthProvider` - Firebase authentication
5. `InvestmentProvider` - Investment data & Firestore sync

**Routes:**
| Route | Component | Protected |
|-------|-----------|-----------|
| `/` | `Home` | No |
| `/login` | `LoginPage` | No |
| `/signup` | `SignupPage` | No |
| `/planning` | `PlanningPage` | **Yes** |

---

#### `firebase.js`
**Purpose:** Firebase configuration and initialization

**Services Initialized:**
- `auth` - Firebase Authentication
- `db` - Cloud Firestore with offline persistence
- `googleProvider` - Google OAuth provider
- `setupRecaptcha()` - Helper for phone authentication

**Security Note:** API keys have fallback values in code. This is safe because Firebase client keys are protected by Firebase Security Rules, not by hiding the keys.

---

### Context Providers

---

#### `AuthContext.jsx`
**Purpose:** User authentication state and methods

**Provides:**
```javascript
{
  user,              // Current Firebase user or null
  loading,           // True during initial auth check
  authError,         // Error from redirect auth
  signUp,            // (email, password) → Promise
  signIn,            // (email, password) → Promise
  signInWithGoogle,  // () → Promise (auto-detects Samsung browser)
  sendPhoneOTP,      // (phone, containerId) → Promise
  verifyPhoneOTP,    // (code) → Promise
  signOut            // () → Promise
}
```

**Google Sign-In Strategy:**
- Samsung Browser → Always uses redirect (popup fails silently)
- Other Mobile → Popup first, redirect fallback
- Desktop → Popup

---

#### `InvestmentContext.jsx`
**Purpose:** Investment data management with Firestore sync

**Provides:**
```javascript
{
  // State
  exchangeRate,              // THB per USD (default 32)
  accounts,                  // Array of currency accounts
  investments,               // Array of investments
  isLoading,                 // True while loading from Firestore
  isSyncing,                 // True while saving to Firestore

  // CRUD
  addAccount, removeAccount, updateAccount,
  addInvestment, removeInvestment, updateInvestment,

  // Calculations
  getInvestmentCostBreakdown,  // Cost per account
  isInvestmentOverspent,       // Can't fully allocate

  // DCA
  generateDcaSchedule,
  toggleDcaCompletion,
  getDcaCompletionCount
}
```

**Auto-Save Logic:**
1. User makes change → State updates immediately
2. After 1 second of no changes → Debounced save triggers
3. Compares with last saved data → Only saves if different
4. Firestore's `onSnapshot` syncs to other devices

**Data Model:**
```javascript
// Account
{ id, name, currency: 'THB'|'USD', amount }

// Investment
{
  id, name, percentage,
  accountPriority: [accountId, ...],
  dcaType: 'daily'|'weekly'|'monthly'|'quarterly'|'yearly'|'custom',
  dcaStartDate, dcaEndDate,
  dcaHistory: [{ date, completed }]
}
```

---

#### `LanguageContext.jsx`
**Purpose:** Internationalization (English/Thai)

**Provides:**
```javascript
{ language, toggleLanguage, t }
```

**Usage:**
```javascript
const { t } = useLanguage();
return <h1>{t.welcomeTitle}</h1>;
```

---

#### `ThemeContext.jsx`
**Purpose:** Dark/Light theme toggle

**Provides:**
```javascript
{ isDark, toggleTheme }
```

**CSS Targeting:**
```css
[data-theme="dark"] { --bg-color: #0f172a; }
[data-theme="light"] { --bg-color: #ffffff; }
```

---

### Components

---

#### `Navbar.jsx`
**Purpose:** Top navigation bar with logo, links, toggles, auth buttons

**Features:**
- Mobile hamburger menu
- Theme toggle button
- Language toggle button (EN/TH)
- Login/Logout button (based on auth state)

---

#### `ProtectedRoute.jsx`
**Purpose:** Auth guard that redirects unauthenticated users

**Flow:**
1. User visits protected route
2. If loading → Show spinner
3. If not logged in → Redirect to `/login`
4. If logged in → Render children

---

### Pages

---

#### `Home.jsx`
**Purpose:** Marketing landing page

**Sections:**
- Hero with CTA
- Origin story
- Feature cards
- Footer

---

#### `LoginPage.jsx` / `SignupPage.jsx`
**Purpose:** Authentication forms

**Features:**
- Tab switching (Email/Phone)
- Google Sign-In button
- Error display
- Redirect to `/planning` on success

---

#### `PlanningPage.jsx`
**Purpose:** Main investment planning interface

**Features:**
- Exchange rate editor (sticky)
- Accounts grid with add/edit/delete
- Investments grid with cost breakdown
- DCA schedule with checkboxes
- Loading spinner while fetching data
- Sync indicator while saving

---

## 🔒 Security

1. **`.env` is gitignored** - API keys not uploaded to GitHub
2. **Firestore Rules** - Users can only access their own data
3. **ProtectedRoute** - `/planning` requires authentication

### Firestore Security Rules
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

## 🛠️ Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## 🔧 Common Modifications

### Add a New Account Field
1. Update account object in `InvestmentContext.jsx`
2. Add input in `PlanningPage.jsx` modal
3. Update display in account card

### Add a New Page
1. Create `NewPage.jsx` in `pages/`
2. Add route in `App.jsx`
3. Add link in `Navbar.jsx`
4. Add translations in `translations.js`

### Add New Translations
```javascript
// In translations.js
export const translations = {
  en: { myNewKey: "English text" },
  th: { myNewKey: "ข้อความภาษาไทย" }
};

// In component
const { t } = useLanguage();
return <p>{t.myNewKey}</p>;
```
