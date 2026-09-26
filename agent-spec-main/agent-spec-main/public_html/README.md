# Maze Bank (HTML/CSS/JS + PHP) — Hostinger Deployment Guide

This build of Maze Bank is architected specifically for shared Apache/PHP/MySQL hosting environments (such as Hostinger). It contains zero Node/React dependencies, zero build pipelines, and zero compile steps. The contents of `public_html/` can be uploaded directly to your hosting root.

---

## 1. Directory Structure

```
public_html/
├── index.html              # Login interface
├── register.html           # Account creation interface
├── dashboard.html          # Account portfolio & quick actions
├── transfer.html           # Peer-to-peer / wire transfer interface
├── history.html            # Statements & transaction search
├── admin.html              # Administration console
├── robots.txt              # Search crawler disallow
├── .htaccess               # Apache headers (noindex)
├── css/
│   └── style.css           # Corporate banking stylesheet
├── js/
│   ├── auth.js             # Login/registration controller
│   ├── dashboard.js        # Account overview & balance loader
│   ├── transfer.js         # Transfer execution controller
│   ├── history.js          # Statement filter & search controller
│   └── admin.js            # User management controller
├── api/
│   ├── config/
│   │   └── db.php          # Database PDO connection & helper routines
│   ├── auth/
│   │   ├── login.php       # Login handler (SQLi & Brute Force vulnerabilities)
│   │   ├── register.php    # Registration handler (parameterized)
│   │   ├── session.php     # Session check & creation (Session Hijacking vulnerability)
│   │   └── logout.php      # Session termination
│   ├── accounts/
│   │   └── balance.php     # Account details & balance lookup
│   ├── transfers/
│   │   └── transfer.php    # Funds transfer handler (parameterized transaction)
│   ├── transactions/
│   │   └── history.php     # Transaction history & search (SQLi vulnerability)
│   └── admin/
│       ├── users.php       # Directory list for admin
│       └── accounts.php    # Account assignment handler
└── database/
    ├── schema.sql          # MySQL table definitions
    └── seed.sql            # Demo seed records
```

---

## 2. Hostinger Setup & Deployment

1. **Upload Files:**
   - Upload all files and folders inside `public_html/` directly into your Hostinger `public_html/` root using File Manager or FTP.
   - Confirm `index.html` resides at `public_html/index.html`.

2. **Create MySQL Database in hPanel:**
   - Go to **hPanel → Databases → Management**.
   - Create a new MySQL database and user. Note down the Database Name, Username, Password, and MySQL Host.

3. **Import Database Schema & Seed Data:**
   - Open **phpMyAdmin** for your database.
   - Import `database/schema.sql`.
   - Import `database/seed.sql`.

4. **Configure Database Credentials:**
   - Open `api/config/db.php` in File Manager.
   - Update `$db_host`, `$db_name`, `$db_user`, and `$db_pass` with your Hostinger MySQL credentials.

5. **Protect the Directory (Optional/Recommended for demo):**
   - Use **hPanel → Advanced → Password Protect Directories** on `public_html/` to prevent unauthorized public scanning.

---

## 3. Academic Vulnerability Documentation

This application contains three intentional security vulnerabilities for educational analysis and testing:

| # | Vulnerability | Target File | Key Lines | Description & Exploitation Mechanism |
|---|---|---|---|---|
| **1** | **SQL Injection (Authentication Bypass)** | `api/auth/login.php` | Lines 25–35 | **Vulnerability:** Unsanitized string concatenation into SQL query (`SELECT * FROM users WHERE username = '$username'`).<br>**Exploit Payload:** Input `admin' -- ` as username with any password to bypass password validation and log in as administrator. |
| **2** | **SQL Injection (Data Leakage / Filter Injection)** | `api/transactions/history.php` | Lines 16–25 | **Vulnerability:** Search parameter directly concatenated into `WHERE` clause without parameterization.<br>**Exploit Payload:** Input `' OR '1'='1' -- ` in search bar to leak all transaction statements across all users, or use `UNION SELECT` to dump data. |
| **3** | **Session Hijacking (Weak Token & Insecure Cookie)** | `api/auth/session.php` | Lines 7–19 | **Vulnerability:** Tokens generated via predictable `md5(username . time())` hash. Cookie dispatched without `HttpOnly`, `Secure`, or `SameSite` flags, allowing client-side JavaScript access via `document.cookie` and network sniffing. |
| **4** | **Brute Force (Credential Stuffing)** | `api/auth/login.php` | Lines 20–24 | **Vulnerability:** Absence of IP rate limiting, failed attempt lockout, CAPTCHA, or exponential delay. Allows automated dictionaries to issue unlimited attempts. |

---

## 4. Default Demo Credentials

| Role | Username | Seed Password | Account Number | Balance |
|---|---|---|---|---|
| **Administrator** | `admin` | `AdminSecure2026!` | `MZB-10000001` | $50,000.00 |
| **User 1** | `johndoe` | `CustomerPass123!` | `MZB-10000002` | $12,450.75 |
| **User 2** | `janesmith` | `CustomerPass123!` | `MZB-10000003` | $8,930.50 |
| **User 3** | `robert_taylor` | `CustomerPass123!` | `MZB-10000004` | $3,120.00 |
