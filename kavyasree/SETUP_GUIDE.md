# CarbonCap — Quick Setup Guide

Follow these steps to get the project running on your computer.

---

## ⚡ Option 1: 1-Click Setup (Windows)

1. Double-click **`setup.bat`**.
   - Creates the Python virtual environment (`venv`).
   - Installs all dependencies.
   - Sets up the database and ML model.
   - Installs mobile dependencies (`npm install`).
2. Run the platform:
   - **Backend:** Double-click **`run_backend.bat`** (or open `http://127.0.0.1:5001` in your browser).
   - **Mobile App:** Double-click **`run_mobile.bat`** (scan the QR code with **Expo Go** on your phone).

---

## 💻 Option 2: Terminal Commands (Mac / Linux / Windows)

### 1. Backend Setup (Flask)
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database and ML model
python init_demo_data.py

# Start backend
python app.py
```
> Web UI is now live at: **`http://127.0.0.1:5001`**

### 2. Mobile App Setup (Expo React Native)
In a second terminal window:
```bash
cd CarbonCapMobile
npm install
npx expo start
```
> Scan the QR code in terminal using **Expo Go** on your mobile phone (make sure phone and PC are on the same Wi-Fi).

---

## 🔑 Demo Login Accounts

| Role | Username | Password |
|---|---|---|
| **Trader** | `trader1` | `password123` |
| **Trader** | `trader2` | `password123` |
| **Verifier** | `verifier1` | `password123` |
| **Admin** | `admin1` | `password123` |
