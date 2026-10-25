const express = require('express');
const router = express.Router();
const { getMockData } = require('../config/database');

const attendanceStatuses = ['Present', 'Absent', 'Half-Day', 'On Leave', 'Holiday'];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value) {
  if (!datePattern.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function withEmployeeName(row, data) {
  const employee = data.employees.find((emp) => emp.EMP_ID === row.EMP_ID);
  return { ...row, FULL_NAME: employee ? `${employee.FIRST_NAME} ${employee.LAST_NAME}` : 'Unknown' };
}

router.get('/', (req, res) => {
  const data = getMockData();
  const { month, emp_id } = req.query;
  let records = data.attendance;
  if (month && !/^\d{4}-\d{2}$/.test(String(month))) {
    return res.status(400).json({ status: 'ERROR', message: 'Month must use YYYY-MM format.' });
  }
  if (month) records = records.filter((row) => row.ATT_DATE.startsWith(String(month)));
  if (emp_id) records = records.filter((row) => row.EMP_ID === Number(emp_id));
  records = [...records].sort((a, b) => b.ATT_DATE.localeCompare(a.ATT_DATE) || b.ATT_ID - a.ATT_ID);
  return res.json({ status: 'SUCCESS', data: records.map((row) => withEmployeeName(row, data)) });
});

router.post('/', (req, res) => {
  const { emp_id, date, status, notes } = req.body || {};
  const data = getMockData();
  const employee = data.employees.find((item) => item.EMP_ID === Number(emp_id));
  if (!employee) return res.status(404).json({ status: 'ERROR', message: 'Employee not found.' });
  if (!validDate(date)) return res.status(400).json({ status: 'ERROR', message: 'Enter a valid attendance date.' });
  if (!attendanceStatuses.includes(status)) return res.status(400).json({ status: 'ERROR', message: 'Choose a valid attendance status.' });

  let record = data.attendance.find((row) => row.EMP_ID === employee.EMP_ID && row.ATT_DATE === date);
  if (record) {
    if (record.CLOCK_IN && !record.CLOCK_OUT && status !== 'Present') {
      return res.status(409).json({ status: 'ERROR', message: 'Clock out this employee before changing today’s attendance status.' });
    }
    record.STATUS = status;
    record.NOTES = String(notes || '').trim();
    if (status !== 'Present') {
      record.CLOCK_IN = null;
      record.CLOCK_OUT = null;
      record.TOTAL_HOURS = 0;
      record.OVERTIME_HRS = 0;
    }
  } else {
    record = {
      ATT_ID: data.attendance.reduce((max, item) => Math.max(max, item.ATT_ID), 0) + 1,
      EMP_ID: employee.EMP_ID,
      ATT_DATE: date,
      CLOCK_IN: null,
      CLOCK_OUT: null,
      TOTAL_HOURS: 0,
      OVERTIME_HRS: 0,
      STATUS: status,
      NOTES: String(notes || '').trim()
    };
    data.attendance.push(record);
  }

  return res.status(201).json({ status: 'SUCCESS', data: withEmployeeName(record, data), message: 'Attendance marked successfully.' });
});

router.post('/clock-in', (req, res) => {
  const { emp_id } = req.body || {};
  const data = getMockData();
  const employee = data.employees.find((item) => item.EMP_ID === Number(emp_id) && item.STATUS === 'Active');
  if (!employee) return res.status(404).json({ status: 'ERROR', message: 'Active employee not found.' });

  const today = localDateString();
  const existing = data.attendance.find((row) => row.EMP_ID === employee.EMP_ID && row.ATT_DATE === today);
  if (existing) return res.status(409).json({ status: 'ERROR', message: 'Attendance is already recorded for today.' });

  const record = {
    ATT_ID: data.attendance.reduce((max, row) => Math.max(max, row.ATT_ID), 0) + 1,
    EMP_ID: employee.EMP_ID,
    ATT_DATE: today,
    CLOCK_IN: new Date().toISOString(),
    CLOCK_OUT: null,
    TOTAL_HOURS: 0,
    OVERTIME_HRS: 0,
    STATUS: 'Present',
    NOTES: ''
  };
  data.attendance.push(record);
  return res.status(201).json({ status: 'SUCCESS', data: withEmployeeName(record, data), message: 'Clocked in successfully.' });
});

router.post('/clock-out', (req, res) => {
  const { emp_id } = req.body || {};
  const data = getMockData();
  const today = localDateString();
  const record = data.attendance.find((row) => row.EMP_ID === Number(emp_id) && row.ATT_DATE === today && row.CLOCK_IN && !row.CLOCK_OUT);
  if (!record) return res.status(400).json({ status: 'ERROR', message: 'No active clock-in found for today.' });

  record.CLOCK_OUT = new Date().toISOString();
  const hours = Math.max(0, (new Date(record.CLOCK_OUT) - new Date(record.CLOCK_IN)) / (1000 * 60 * 60));
  record.TOTAL_HOURS = Number(hours.toFixed(2));
  record.OVERTIME_HRS = hours > 8 ? Number((hours - 8).toFixed(2)) : 0;
  record.STATUS = hours < 4 ? 'Half-Day' : 'Present';
  return res.json({ status: 'SUCCESS', data: withEmployeeName(record, data), message: 'Clocked out successfully.' });
});

router.put('/:id', (req, res) => {
  const data = getMockData();
  const record = data.attendance.find((row) => row.ATT_ID === Number(req.params.id));
  if (!record) return res.status(404).json({ status: 'ERROR', message: 'Attendance record not found.' });

  const { status, notes } = req.body || {};
  if (status !== undefined && !attendanceStatuses.includes(status)) {
    return res.status(400).json({ status: 'ERROR', message: 'Choose a valid attendance status.' });
  }
  if (status !== undefined) record.STATUS = status;
  if (notes !== undefined) record.NOTES = String(notes).trim();
  if (status && status !== 'Present') {
    record.CLOCK_IN = null;
    record.CLOCK_OUT = null;
    record.TOTAL_HOURS = 0;
    record.OVERTIME_HRS = 0;
  }
  return res.json({ status: 'SUCCESS', data: withEmployeeName(record, data), message: 'Attendance updated successfully.' });
});

router.delete('/:id', (req, res) => {
  const data = getMockData();
  const index = data.attendance.findIndex((row) => row.ATT_ID === Number(req.params.id));
  if (index === -1) return res.status(404).json({ status: 'ERROR', message: 'Attendance record not found.' });
  data.attendance.splice(index, 1);
  return res.json({ status: 'SUCCESS', message: 'Attendance record deleted.' });
});

module.exports = router;
