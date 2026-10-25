require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/performance', require('./routes/performance'));

app.get('/api/dashboard', async (req, res) => {
  try {
    const data = database.getMockData();
    const stats = {
      totalEmployees: data.employees.filter((emp) => emp.STATUS === 'Active').length,
      totalDepartments: data.departments.filter((dept) => dept.IS_ACTIVE === 'Y').length,
      todayPresent: data.attendance.filter((row) => row.ATT_DATE === new Date().toISOString().slice(0, 10) && row.STATUS === 'Present').length,
      pendingLeaves: data.leaves.filter((leave) => leave.APPROVAL === 'Pending').length,
      departmentStats: data.departments.map((dept) => ({
        DEPT_NAME: dept.DEPT_NAME,
        EMP_COUNT: data.employees.filter((emp) => emp.DEPARTMENT_ID === dept.DEPT_ID && emp.STATUS === 'Active').length
      })),
      recentActivity: [
        { table_name: 'EMPLOYEES', action: 'INSERT', new_values: 'Amit Sharma joined Engineering', time_str: 'Today' },
        { table_name: 'PAYROLL', action: 'UPDATE', new_values: 'June payroll approved', time_str: 'Yesterday' },
        { table_name: 'ATTENDANCE', action: 'INSERT', new_values: 'Attendance logged for today', time_str: 'Today' }
      ],
      monthlyPayroll: data.payroll.reduce((sum, payroll) => sum + Number(payroll.NET_SALARY || 0), 0)
    };

    return res.json({ status: 'SUCCESS', data: stats });
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

async function start() {
  await database.initialize();
  app.listen(PORT, () => {
    console.log(`🚀 EMS Server running on http://localhost:${PORT}`);
  });
}

start();

process.on('SIGTERM', async () => {
  await database.close();
  process.exit(0);
});
