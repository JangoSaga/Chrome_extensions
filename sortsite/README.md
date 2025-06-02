
# 🗂️ SortSite Pro - Chrome Extension

**SortSite Pro** is a productivity-focused Chrome Extension that helps you organize your browser tabs into custom categories. Designed to simplify tab overload, the extension provides a clean UI for managing your sessions efficiently.

---

## 🚀 Features

- ✅ Add, remove, and organize tab categories
- ✅ React-based dynamic welcome page
- ✅ Persistent tab storage using Chrome APIs
- ✅ Lightweight popup for quick access
- ✅ Chrome Extension compliant build with Webpack

---

## 📂 Project Structure

```

tabManager/
├── public/
│   ├── popup.html           # Static HTML for popup
│   ├── index.html           # Template for React welcome page
│   └── manifest.json        # Chrome extension config
├── src/
│   ├── popup/               # JS for popup interaction
│   ├── welcome/             # React app entry point
│   ├── components/          # React components (AppLayout, Home, etc.)
│   ├── background/          # Background script
│   └── content/             # Content script
├── index.jsx                # React entry
├── App.jsx                 # React app component with routing
├── webpack.config.cjs       # Webpack build config
└── ...

````

---

## 🧰 Technologies Used

- [React](https://reactjs.org/)
- [React Router](https://reactrouter.com/)
- [Webpack 5](https://webpack.js.org/)
- [Babel](https://babeljs.io/)
- Chrome Extensions API

Optional:
- [Tailwind CSS](https://tailwindcss.com/) — if configured properly

---

## 🛠️ Setup Instructions

### 1. Clone and install dependencies:

```bash
git clone https://github.com/your-username/tab-manager.git
cd tab-manager
npm install
````

### 2. Build or start in dev mode:

```bash
npm run dev   # watches and rebuilds using Webpack
npm run build # production build
```

### 3. Load into Chrome:

* Go to `chrome://extensions/`
* Enable **Developer Mode**
* Click **Load Unpacked**
* Select the `dist/` folder

---

## ⚙️ Development Notes

* Static popup loads `popup.js`, contains only a redirect button.
* Dynamic React app is mounted via `index.html` and rendered using `index.jsx`.
* Routing inside the React app is handled via `HashRouter` to prevent Chrome extension path issues.
* Avoid inline scripts and styles due to Chrome’s strict **Content Security Policy**.

---

## 🧩 Future Enhancements

* Add drag-and-drop for tab reordering
* Sync data using Chrome Storage Sync
* Add dark mode
