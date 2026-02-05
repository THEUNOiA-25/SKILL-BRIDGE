# Client Credit System Documentation

This folder contains documentation about the credit system as it relates to clients.

## Key Point

**Clients do NOT need credits.** They can post projects for free.

Only freelancers need credits for certain actions (posting work requirements, placing bids, etc.).

## Documentation

- [BACKEND-CHANGES-REQUIRED.md](./BACKEND-CHANGES-REQUIRED.md) - Detailed instructions for backend and frontend teams

## Current Status

- **Frontend:** Using `client_project` type as a workaround to bypass credit deduction
- **Backend:** Needs modification to skip credit deduction for clients (see documentation)

---

## Frontend Checklist (After Backend Fix)

Once backend team completes the trigger modification, do these frontend changes:

- [ ] **PostProjectPage.tsx** (line ~97): Change `'client_project'` → `'work_requirement'`
- [ ] **Client ProjectsPage.tsx** (line ~89): Change `.in([...])` → `.eq("work_requirement")`
- [ ] **Freelancer ProjectsPage.tsx** (lines ~273, ~286): Change `.in([...])` → `.eq("work_requirement")`

See [BACKEND-CHANGES-REQUIRED.md](./BACKEND-CHANGES-REQUIRED.md) for detailed code changes.

---

## Quick Reference

| User Type  | Post Projects | Credits Needed |
|------------|---------------|----------------|
| Client     | ✅ Yes        | ❌ No (FREE)   |
| Freelancer | ✅ Yes        | ✅ Yes (10)    |
