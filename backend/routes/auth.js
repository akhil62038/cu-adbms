const express = require('express');
const router = express.Router();
const { getMockData } = require('../config/database');

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const users = getMockData().users;
  const employees = getMockData().employees;

  const user = users.find((item) => item.USERNAME.toLowerCase() === String(username || '').toLowerCase());
  if (!user || user.IS_ACTIVE !== 'Y') {
    return res.status(401).json({ status: 'ERROR', message: 'Invalid username or password.' });
  }

  const employee = employees.find((emp) => emp.EMP_ID === user.EMP_ID);
  if (!employee) {
    return res.status(401).json({ status: 'ERROR', message: 'User profile not found.' });
  }

  if (password !== 'Pass@123') {
    return res.status(401).json({ status: 'ERROR', message: 'Invalid username or password.' });
  }

  const safeUser = {
    user_id: user.USER_ID,
    emp_id: user.EMP_ID,
    username: user.USERNAME,
    role: user.ROLE,
    FULL_NAME: `${employee.FIRST_NAME} ${employee.LAST_NAME}`,
    department_id: employee.DEPARTMENT_ID,
    status: employee.STATUS
  };

  return res.json({ status: 'SUCCESS', user: safeUser, token: 'demo-token' });
});

router.get('/me', (req, res) => {
  return res.json({ status: 'SUCCESS', user: req.user || null });
});

module.exports = router;
