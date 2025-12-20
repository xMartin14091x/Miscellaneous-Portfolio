# InvestMan! - Codebase Documentation

A comprehensive investment planning companion web application built with React + Vite.

---

## 📁 Project Structure

```
src/
├── main.jsx                    # Application entry point
├── App.jsx                     # Root component with providers & routes
├── index.css                   # Global styles & CSS custom properties
├── translations.js             # i18n translations (EN/TH)
├── context/
│   ├── ThemeContext.jsx        # Dark/Light theme management
│   ├── LanguageContext.jsx     # Language switching (EN/TH)
│   └── InvestmentContext.jsx   # Investment state management
├── components/
│   ├── Navbar.jsx              # Navigation bar with routing
│   └── Navbar.css              # Navbar styling
├── pages/
│   ├── Home.jsx                # Landing page
│   ├── Home.css                # Home page styling
│   ├── PlanningPage.jsx        # Investment planning interface
│   └── PlanningPage.css        # Planning page styling
└── assets/                     # Static assets
```

---

## 🚀 Routing

Uses **react-router-dom** for navigation:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home` | Landing page with hero, features, CTA |
| `/planning` | `PlanningPage` | Investment planning interface |

---

## 🎨 Theming System

### CSS Custom Properties (`index.css`)

| Variable | Purpose |
|----------|---------|
| `--primary-color` | Main green (#10b981) |
| `--primary-light` | Lighter green (#34d399) |
| `--primary-dark` | Darker green (#059669) |
| `--bg-color` | Page background |
| `--hero-glow` | Green glow effect |

### Theme Context (`context/ThemeContext.jsx`)

- **Hook**: `useTheme()` returns `{ isDark, toggleTheme }`
- **Storage**: `localStorage` key `investman-theme`

---

## 🌐 Internationalization (i18n)

### Language Context (`context/LanguageContext.jsx`)

- **Languages**: English (`en`), Thai (`th`)
- **Hook**: `useLanguage()` returns `{ language, toggleLanguage, t }`
- **Thai Font**: Kanit (applied via `data-language="th"`)

---

## 💰 Investment Context (`context/InvestmentContext.jsx`)

State management for the Planning page:

```javascript
const {
  exchangeRate, setExchangeRate,  // THB per USD (default: 32)
  accounts, addAccount, removeAccount, updateAccount,
  investments, addInvestment, removeInvestment, updateInvestment,
  plans, savePlan, loadPlan, deletePlan,
  currentPlanName, setCurrentPlanName
} = useInvestment();
```

### Data Structures

**Account:**
```javascript
{ id, name, currency: 'THB' | 'USD', amount }
```

**Investment:**
```javascript
{ id, name, percentage, accountPriority: [accountId, ...], dcaTimeframe }
```

---

## 📄 Pages

### Home Page (`pages/Home.jsx`)

| Section | Description |
|---------|-------------|
| Hero | Full-height intro with green glow effect |
| Origin | "Our Origin" story |
| Importance | Feature cards grid |
| CTA | Links to `/planning` |
| Footer | Copyright |

### Planning Page (`pages/PlanningPage.jsx`)

| Component | Description |
|-----------|-------------|
| Exchange Rate Bar | Top-right editable input (THB/USD) |
| Sidebar | Toggleable plans list (left) |
| Accounts Grid | Currency accounts (THB/USD) |
| Investments Grid | Investment allocations |
| Add Buttons | Modals for adding accounts/investments |

---

## 🛠️ Development

```bash
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Production build
```

### Adding New Translations

1. Open `src/translations.js`
2. Add key to both `en` and `th` objects
3. Use via `t.yourNewKey` in components

---

## 📚 Dependencies

- **React 18** - UI framework
- **Vite** - Build tool
- **react-router-dom** - Client-side routing
- **Google Fonts** - Inter (EN) + Kanit (TH)

---

## 🎯 Key Design Decisions

1. **CSS Variables** - Theming without Tailwind
2. **Context API** - Global state for theme, language, investments
3. **localStorage** - User preferences persist
4. **Responsive** - Mobile-first with `clamp()` typography
5. **Modals** - Account/Investment forms in overlay modals
