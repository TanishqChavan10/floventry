# 📦 Flowventory - Smart Inventory Management System

This is the **frontend** for Flowventory built with:

* Next.js 14 (App Router)
* TypeScript
* Tailwind CSS
* ShadCN UI
* Clerk (for admin login only)
* PostgreSQL (via backend API)

---
This is the **Backend** for Flowventory built with:
*Neeraj and Hrishikesh eventually will fill this*


## 🚀 Getting Started (for Collaborators)

### 1. **Clone the Repository**

```bash
git clone https://github.com/<your-username>/inventory-frontend.git
cd inventory-frontend
```

### 2. **Install Dependencies**

```bash
npm install
```


### 3. **Run the Development Server**

```bash
npm run dev
```

App will be available at:
➡️ `http://localhost:3000`


---

## 👥 Team Roles

| Member     | Role                    |
| ---------- | ----------------------- |
| Tanishq    | Frontend + Auth Setup   |
| Neeraj     | Backend API + DB Models |
| Hrishikesh | Backend Routes + Logic  |

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14 + App Router, Tailwind CSS, ShadCN UI
* **Auth:** Clerk (admin-only login)
* **Backend:** Node.js + Express (assumed) with PostgreSQL

---

## 🔐 Auth Notes

* Only admins can log in
* Clerk signup is disabled
* Protected routes use `SignedIn` / `SignedOut` from Clerk

---

## 📜 To Do

* [x] Frontend setup
* [x] Clerk configured (login only)
* [ ] Backend integration (APIs)
* [ ] Inventory list + add/edit UI
* [ ] Product image (optional)

---

