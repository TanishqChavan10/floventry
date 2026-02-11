# 📦 Floventry - Smart Inventory Management System

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
git clone https://github.com/<your-org-or-username>/floventry.git
cd floventry
```

### 2. **Frontend: Install Dependencies**

```bash
cd frontend
npm install
```

### 3. **Frontend: Configure Environment Variables**

Create `frontend/.env.local` (or copy from the example):

```powershell
Copy-Item .env.example .env.local
```

At minimum, set:

* `NEXT_PUBLIC_GRAPHQL_URL` (must end with `/graphql`, e.g. `http://localhost:5000/api/graphql`)


### 4. **Frontend: Run the Development Server**

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

## Design & Safety Docs

* Barcode Phase 0 scope lock (must read before implementing barcode): `backend/docs/barcode/phase-0-scope-and-safety.md`

---

