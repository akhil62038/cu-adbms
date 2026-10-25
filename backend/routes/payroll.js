const express = require('express');
const router = express.Router();
const { getMockData } = require('../config/database');

const workingDaysPerMonth = 22;

function payrollForEmployee(employee, month, data) {
  const records = data.attendance.filter((row) => row.EMP_ID === employee.EMP_ID && row.ATT_DATE.startsWith(month));
  const creditedDays = records.reduce((total, row) => {
    if (row.STATUS === 'Present' || row.STATUS === 'On Leave') return total + 1;
    if (row.STATUS === 'Half-Day') return total + 0.5;
    return total;
  }, 0);
  const attendanceFactor = Math.min(creditedDays / workingDaysPerMonth, 1);
  const monthlyBase = Number(employee.BASE_SALARY || 0);
  const earnedBase = Number((monthlyBase * attendanceFactor).toFixed(2));
  const hra = Number((earnedBase * 0.2).toFixed(2));
  const da = Number((earnedBase * 0.1).toFixed(2));
  const transport = Number((1500 * attendanceFactor).toFixed(2));
  const overtimeHours = records.reduce((sum, row) => sum + Number(row.OVERTIME_HRS || 0), 0);
  const overtimePay = Number((overtimeHours * (monthlyBase / workingDaysPerMonth / 8) * 1.5).toFixed(2));

  const latestReview = data.performance
    .filter((review) => review.EMP_ID === employee.EMP_ID)
    .sort((a, b) => b.REVIEW_PERIOD.localeCompare(a.REVIEW_PERIOD))[0];
  const rating = latestReview ? Number(latestReview.RATING) : 0;
  const performanceBonusRate = rating >= 4.5 ? 0.05 : rating >= 4 ? 0.03 : 0;
  const bonus = Number((monthlyBase * performanceBonusRate * attendanceFactor).toFixed(2));
  const gross = earnedBase + hra + da + transport + overtimePay + bonus;
  const pf = Number((earnedBase * 0.12).toFixed(2));
  const tax = Number((earnedBase * 0.05).toFixed(2));
  const insurance = earnedBase > 0 ? 500 : 0;
  const totalDeduction = pf + tax + insurance;
  const net = Math.max(0, Number((gross - totalDeduction).toFixed(2)));
  const wholeDaysPresent = records.filter((row) => row.STATUS === 'Present').length;
  const halfDaysPresent = records.filter((row) => row.STATUS === 'Half-Day').length;

  return {
    PAY_ID: 0,
    EMP_ID: employee.EMP_ID,
    PAY_MONTH: month,
    WORKING_DAYS: workingDaysPerMonth,
    DAYS_PRESENT: wholeDaysPresent + halfDaysPresent,
    DAYS_CREDITED: Number(creditedDays.toFixed(1)),
    MONTHLY_BASE_PAY: monthlyBase,
    BASE_PAY: earnedBase,
    HRA: hra,
    DA: da,
    TRANSPORT: transport,
    OVERTIME_HOURS: Number(overtimeHours.toFixed(2)),
    OVERTIME_PAY: overtimePay,
    PERFORMANCE_RATING: rating || null,
    BONUS: bonus,
    GROSS_SALARY: Number(gross.toFixed(2)),
    PF_DEDUCTION: pf,
    TAX: tax,
    INSURANCE: insurance,
    ADVANCE_DEDUCT: 0,
    TOTAL_DEDUCT: Number(totalDeduction.toFixed(2)),
    NET_SALARY: net,
    PAY_DATE: new Date().toISOString().slice(0, 10),
    STATUS: 'Generated'
  };
}

router.get('/', (req, res) => {
  const data = getMockData();
  const result = data.payroll.map((item) => {
    const emp = data.employees.find((e) => e.EMP_ID === item.EMP_ID);
    return {
      ...item,
      FULL_NAME: emp ? `${emp.FIRST_NAME} ${emp.LAST_NAME}` : 'Unknown',
      DEPT_NAME: data.departments.find((d) => d.DEPT_ID === emp?.DEPARTMENT_ID)?.DEPT_NAME || 'N/A'
    };
  });
  return res.json({ status: 'SUCCESS', data: result });
});

router.post('/generate', (req, res) => {
  const { emp_id, month } = req.body || {};
  const data = getMockData();
  const monthKey = month || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(monthKey))) {
    return res.status(400).json({ status: 'ERROR', message: 'Payroll month must use YYYY-MM format.' });
  }

  const employees = emp_id
    ? data.employees.filter((employee) => employee.EMP_ID === Number(emp_id) && employee.STATUS === 'Active')
    : data.employees.filter((employee) => employee.STATUS === 'Active');
  if (!employees.length) {
    return res.status(404).json({ status: 'ERROR', message: 'No active employee found for payroll generation.' });
  }

  const existingEmployee = employees.find((employee) =>
    data.payroll.some((pay) => pay.EMP_ID === employee.EMP_ID && pay.PAY_MONTH === monthKey)
  );
  if (existingEmployee) {
    return res.status(409).json({
      status: 'ERROR',
      message: `Payroll already exists for ${existingEmployee.FIRST_NAME} ${existingEmployee.LAST_NAME} in ${monthKey}.`
    });
  }

  const generated = employees.map((employee) => payrollForEmployee(employee, monthKey, data));
  generated.forEach((payroll) => {
    payroll.PAY_ID = data.payroll.reduce((max, row) => Math.max(max, row.PAY_ID), 0) + 1;
    data.payroll.push(payroll);
  });
  return res.status(201).json({
    status: 'SUCCESS',
    data: generated,
    message: `Payroll generated for ${generated.length} employee${generated.length === 1 ? '' : 's'} using attendance and the latest performance review.`
  });
});

module.exports = router;
