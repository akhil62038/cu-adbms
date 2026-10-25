# Employee Management System

This project contains a full-stack employee management system with:

- Oracle PL/SQL schema scripts under `database/`
- Express.js REST API under `backend/`
- Frontend dashboard and management screens under `frontend/`

## Quick start

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the API:
   ```bash
   npm start
   ```
3. Open the app in a browser at: `http://localhost:3000`

## Demo login

- Username: `priya.patel`
- Password: `Pass@123`

The frontend uses the Express app to serve pages and route access through `/api`.

## Employee operations

After signing in, use the sidebar to open Employees, Attendance, Performance, and Payroll:

- **Employees:** add, edit, search, filter, and delete employees. Employee IDs are assigned automatically. A record includes name, email, phone, address, department, designation, monthly base salary, status, and optional personal details.
- **Attendance:** mark Present, Absent, Half-Day, On Leave, or Holiday for a date; edit or delete a record; or use clock-in/clock-out to record hours.
- **Performance:** add, edit, and delete reviews. Reviews require an overall rating and category ratings from 1 to 5.
- **Payroll:** generate for one employee or all active employees for a month. It credits Present as one day, Half-Day as half a day, and On Leave as one day, using 22 working days. Monthly base salary and allowances are prorated by credited attendance. Overtime is paid at 1.5 times the hourly base rate. The latest performance rating earns a bonus of 5% at 4.5 or higher, 3% at 4.0–4.49, and no bonus below 4.0. Payroll is generated only once per employee and month.

The API currently stores operational data in memory for demonstration. Changes are lost when the Node.js server restarts. The SQL files provide the Oracle schema and PL/SQL examples but are not yet connected to the application routes.
