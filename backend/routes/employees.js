const express = require('express');
const router = express.Router();
const { getMockData } = require('../config/database');

const requiredText = (value) => typeof value === 'string' && value.trim().length > 0;

function validateEmployee(payload, partial = false) {
  const errors = [];
  const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'address', 'designation'];

  if (!partial) {
    requiredFields.forEach((field) => {
      if (!requiredText(payload[field])) errors.push(`${field.replace('_', ' ')} is required.`);
    });
  } else {
    requiredFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field) && !requiredText(payload[field])) {
        errors.push(`${field.replace('_', ' ')} cannot be empty.`);
      }
    });
  }

  const email = payload.email;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
  if (payload.phone && !/^[+()\d .-]{7,20}$/.test(payload.phone)) errors.push('Enter a valid phone number.');
  if (payload.base_salary !== undefined && (!Number.isFinite(Number(payload.base_salary)) || Number(payload.base_salary) < 0)) {
    errors.push('Salary must be a non-negative number.');
  }
  if (payload.department_id !== undefined && !Number.isInteger(Number(payload.department_id))) {
    errors.push('Choose a valid department.');
  }
  if (payload.status && !['Active', 'Inactive', 'Terminated', 'On Leave'].includes(payload.status)) {
    errors.push('Choose a valid employee status.');
  }

  return errors;
}

function employeeForResponse(employee, data) {
  const department = data.departments.find((item) => item.DEPT_ID === employee.DEPARTMENT_ID);
  return {
    ...employee,
    FULL_NAME: `${employee.FIRST_NAME} ${employee.LAST_NAME}`,
    DEPT_NAME: department?.DEPT_NAME || 'N/A',
    YEARS_EXP: Math.max(0, new Date().getFullYear() - new Date(employee.HIRE_DATE).getFullYear())
  };
}

router.get('/', (req, res) => {
  const data = getMockData();
  const { department, status, search } = req.query;
  let employees = data.employees;

  if (department) employees = employees.filter((emp) => String(emp.DEPARTMENT_ID) === String(department));
  if (status) employees = employees.filter((emp) => emp.STATUS === status);
  if (search) {
    const term = String(search).toLowerCase();
    employees = employees.filter((emp) =>
      `${emp.FIRST_NAME} ${emp.LAST_NAME}`.toLowerCase().includes(term)
      || emp.EMAIL.toLowerCase().includes(term)
      || emp.PHONE.toLowerCase().includes(term)
      || emp.DESIGNATION.toLowerCase().includes(term)
      || emp.ADDRESS.toLowerCase().includes(term)
    );
  }

  return res.json({ status: 'SUCCESS', data: employees.map((emp) => employeeForResponse(emp, data)) });
});

router.get('/:id', (req, res) => {
  const data = getMockData();
  const employee = data.employees.find((emp) => emp.EMP_ID === Number(req.params.id));
  if (!employee) return res.status(404).json({ status: 'ERROR', message: 'Employee not found.' });
  return res.json({ status: 'SUCCESS', data: employeeForResponse(employee, data) });
});

router.post('/', (req, res) => {
  const payload = req.body || {};
  const errors = validateEmployee(payload);
  const data = getMockData();
  if (errors.length) return res.status(400).json({ status: 'ERROR', message: errors.join(' ') });

  const email = payload.email.trim().toLowerCase();
  if (data.employees.some((emp) => emp.EMAIL.toLowerCase() === email)) {
    return res.status(409).json({ status: 'ERROR', message: 'An employee with this email already exists.' });
  }
  const departmentId = Number(payload.department_id);
  if (!data.departments.some((dept) => dept.DEPT_ID === departmentId && dept.IS_ACTIVE === 'Y')) {
    return res.status(400).json({ status: 'ERROR', message: 'Choose an active department.' });
  }

  const newEmployee = {
    EMP_ID: data.employees.reduce((max, emp) => Math.max(max, emp.EMP_ID), 1000) + 1,
    FIRST_NAME: payload.first_name.trim(),
    LAST_NAME: payload.last_name.trim(),
    EMAIL: email,
    PHONE: payload.phone.trim(),
    ADDRESS: payload.address.trim(),
    DATE_OF_BIRTH: payload.date_of_birth || null,
    GENDER: payload.gender || 'Other',
    HIRE_DATE: payload.hire_date || new Date().toISOString().slice(0, 10),
    DEPARTMENT_ID: departmentId,
    DESIGNATION: payload.designation.trim(),
    BASE_SALARY: Number(payload.base_salary || 0),
    STATUS: payload.status || 'Active',
    PHOTO_URL: null
  };

  data.employees.push(newEmployee);
  return res.status(201).json({
    status: 'SUCCESS',
    data: employeeForResponse(newEmployee, data),
    message: 'Employee added successfully.'
  });
});

router.put('/:id', (req, res) => {
  const data = getMockData();
  const employee = data.employees.find((emp) => emp.EMP_ID === Number(req.params.id));
  if (!employee) return res.status(404).json({ status: 'ERROR', message: 'Employee not found.' });

  const payload = req.body || {};
  const errors = validateEmployee(payload, true);
  if (errors.length) return res.status(400).json({ status: 'ERROR', message: errors.join(' ') });

  if (payload.email && data.employees.some((emp) => emp.EMP_ID !== employee.EMP_ID && emp.EMAIL.toLowerCase() === payload.email.trim().toLowerCase())) {
    return res.status(409).json({ status: 'ERROR', message: 'An employee with this email already exists.' });
  }
  if (payload.department_id !== undefined) {
    const departmentId = Number(payload.department_id);
    if (!data.departments.some((dept) => dept.DEPT_ID === departmentId && dept.IS_ACTIVE === 'Y')) {
      return res.status(400).json({ status: 'ERROR', message: 'Choose an active department.' });
    }
    employee.DEPARTMENT_ID = departmentId;
  }

  const fields = {
    first_name: 'FIRST_NAME',
    last_name: 'LAST_NAME',
    email: 'EMAIL',
    phone: 'PHONE',
    address: 'ADDRESS',
    date_of_birth: 'DATE_OF_BIRTH',
    gender: 'GENDER',
    hire_date: 'HIRE_DATE',
    designation: 'DESIGNATION',
    status: 'STATUS'
  };
  Object.entries(fields).forEach(([input, key]) => {
    if (payload[input] !== undefined) {
      employee[key] = typeof payload[input] === 'string' ? payload[input].trim() : payload[input];
    }
  });
  if (payload.email !== undefined) employee.EMAIL = payload.email.trim().toLowerCase();
  if (payload.base_salary !== undefined) employee.BASE_SALARY = Number(payload.base_salary);

  return res.json({
    status: 'SUCCESS',
    data: employeeForResponse(employee, data),
    message: 'Employee updated successfully.'
  });
});

router.delete('/:id', (req, res) => {
  const data = getMockData();
  const employeeId = Number(req.params.id);
  const index = data.employees.findIndex((emp) => emp.EMP_ID === employeeId);
  if (index === -1) return res.status(404).json({ status: 'ERROR', message: 'Employee not found.' });

  const [employee] = data.employees.splice(index, 1);
  data.users = data.users.filter((user) => user.EMP_ID !== employeeId);
  data.attendance = data.attendance.filter((row) => row.EMP_ID !== employeeId);
  data.leaves = data.leaves.filter((leave) => leave.EMP_ID !== employeeId && leave.APPROVED_BY !== employeeId);
  data.performance = data.performance.filter((review) => review.EMP_ID !== employeeId && review.REVIEWER_ID !== employeeId);
  data.payroll = data.payroll.filter((pay) => pay.EMP_ID !== employeeId);
  data.departments.forEach((dept) => {
    if (dept.MANAGER_ID === employeeId) dept.MANAGER_ID = null;
  });

  return res.json({ status: 'SUCCESS', message: `${employee.FIRST_NAME} ${employee.LAST_NAME} and related sample records were deleted.` });
});

module.exports = router;
