const oracledb = require('oracledb');

const mockData = {
  departments: [
    { DEPT_ID: 10, DEPT_NAME: 'Information Technology', LOCATION: 'Building A - Floor 1', MANAGER_ID: 1001, IS_ACTIVE: 'Y' },
    { DEPT_ID: 20, DEPT_NAME: 'Human Resources', LOCATION: 'Building B - Floor 1', MANAGER_ID: 1002, IS_ACTIVE: 'Y' },
    { DEPT_ID: 30, DEPT_NAME: 'Finance', LOCATION: 'Building A - Floor 2', MANAGER_ID: 1004, IS_ACTIVE: 'Y' },
    { DEPT_ID: 40, DEPT_NAME: 'Marketing', LOCATION: 'Building C - Floor 1', MANAGER_ID: 1005, IS_ACTIVE: 'Y' },
    { DEPT_ID: 50, DEPT_NAME: 'Operations', LOCATION: 'Building D - Floor 1', MANAGER_ID: 1007, IS_ACTIVE: 'Y' }
  ],
  employees: [
    { EMP_ID: 1001, FIRST_NAME: 'Amit', LAST_NAME: 'Sharma', EMAIL: 'amit.sharma@company.com', PHONE: '9876543210', DATE_OF_BIRTH: '1990-05-15', GENDER: 'Male', ADDRESS: 'Pune', HIRE_DATE: '2020-01-15', DEPARTMENT_ID: 10, DESIGNATION: 'Senior Developer', BASE_SALARY: 85000, STATUS: 'Active', PHOTO_URL: null },
    { EMP_ID: 1002, FIRST_NAME: 'Priya', LAST_NAME: 'Patel', EMAIL: 'priya.patel@company.com', PHONE: '9123456789', DATE_OF_BIRTH: '1988-11-20', GENDER: 'Female', ADDRESS: 'Mumbai', HIRE_DATE: '2019-06-01', DEPARTMENT_ID: 20, DESIGNATION: 'HR Manager', BASE_SALARY: 78000, STATUS: 'Active', PHOTO_URL: null },
    { EMP_ID: 1003, FIRST_NAME: 'Rahul', LAST_NAME: 'Verma', EMAIL: 'rahul.verma@company.com', PHONE: '9988776655', DATE_OF_BIRTH: '1995-03-10', GENDER: 'Male', ADDRESS: 'Delhi', HIRE_DATE: '2022-08-20', DEPARTMENT_ID: 10, DESIGNATION: 'Junior Developer', BASE_SALARY: 42000, STATUS: 'Active', PHOTO_URL: null },
    { EMP_ID: 1004, FIRST_NAME: 'Sneha', LAST_NAME: 'Gupta', EMAIL: 'sneha.gupta@company.com', PHONE: '9001122334', DATE_OF_BIRTH: '1992-07-25', GENDER: 'Female', ADDRESS: 'Bengaluru', HIRE_DATE: '2021-03-15', DEPARTMENT_ID: 30, DESIGNATION: 'Senior Accountant', BASE_SALARY: 62000, STATUS: 'Active', PHOTO_URL: null },
    { EMP_ID: 1005, FIRST_NAME: 'Vikram', LAST_NAME: 'Singh', EMAIL: 'vikram.singh@company.com', PHONE: '9112233445', DATE_OF_BIRTH: '1987-12-05', GENDER: 'Male', ADDRESS: 'Hyderabad', HIRE_DATE: '2018-01-10', DEPARTMENT_ID: 40, DESIGNATION: 'Marketing Director', BASE_SALARY: 95000, STATUS: 'Active', PHOTO_URL: null },
    { EMP_ID: 1006, FIRST_NAME: 'Ananya', LAST_NAME: 'Reddy', EMAIL: 'ananya.reddy@company.com', PHONE: '9223344556', DATE_OF_BIRTH: '1993-09-18', GENDER: 'Female', ADDRESS: 'Chennai', HIRE_DATE: '2021-11-01', DEPARTMENT_ID: 10, DESIGNATION: 'Full Stack Developer', BASE_SALARY: 72000, STATUS: 'Active', PHOTO_URL: null },
    { EMP_ID: 1007, FIRST_NAME: 'Karan', LAST_NAME: 'Mehta', EMAIL: 'karan.mehta@company.com', PHONE: '9334455667', DATE_OF_BIRTH: '1994-02-28', GENDER: 'Male', ADDRESS: 'Ahmedabad', HIRE_DATE: '2023-04-10', DEPARTMENT_ID: 50, DESIGNATION: 'Operations Analyst', BASE_SALARY: 48000, STATUS: 'Active', PHOTO_URL: null },
    { EMP_ID: 1008, FIRST_NAME: 'Deepika', LAST_NAME: 'Nair', EMAIL: 'deepika.nair@company.com', PHONE: '9445566778', DATE_OF_BIRTH: '1991-06-12', GENDER: 'Female', ADDRESS: 'Kochi', HIRE_DATE: '2020-09-01', DEPARTMENT_ID: 20, DESIGNATION: 'HR Executive', BASE_SALARY: 45000, STATUS: 'Active', PHOTO_URL: null }
  ],
  users: [
    { USER_ID: 1, EMP_ID: 1001, USERNAME: 'amit.sharma', PASSWORD_HASH: 'hashed_Pass@123', ROLE: 'Manager', IS_ACTIVE: 'Y' },
    { USER_ID: 2, EMP_ID: 1002, USERNAME: 'priya.patel', PASSWORD_HASH: 'hashed_Pass@123', ROLE: 'HR', IS_ACTIVE: 'Y' },
    { USER_ID: 3, EMP_ID: 1003, USERNAME: 'rahul.verma', PASSWORD_HASH: 'hashed_Pass@123', ROLE: 'Employee', IS_ACTIVE: 'Y' },
    { USER_ID: 4, EMP_ID: 1004, USERNAME: 'sneha.gupta', PASSWORD_HASH: 'hashed_Pass@123', ROLE: 'Employee', IS_ACTIVE: 'Y' },
    { USER_ID: 5, EMP_ID: 1005, USERNAME: 'vikram.singh', PASSWORD_HASH: 'hashed_Pass@123', ROLE: 'Manager', IS_ACTIVE: 'Y' }
  ],
  attendance: [
    { ATT_ID: 1, EMP_ID: 1001, ATT_DATE: '2025-06-01', CLOCK_IN: '2025-06-01T09:00:00', CLOCK_OUT: '2025-06-01T18:00:00', TOTAL_HOURS: 9, OVERTIME_HRS: 1, STATUS: 'Present' },
    { ATT_ID: 2, EMP_ID: 1001, ATT_DATE: '2025-06-02', CLOCK_IN: '2025-06-02T09:00:00', CLOCK_OUT: '2025-06-02T17:30:00', TOTAL_HOURS: 8.5, OVERTIME_HRS: 0.5, STATUS: 'Present' },
    { ATT_ID: 3, EMP_ID: 1003, ATT_DATE: '2025-06-01', CLOCK_IN: '2025-06-01T10:00:00', CLOCK_OUT: '2025-06-01T18:00:00', TOTAL_HOURS: 8, OVERTIME_HRS: 0, STATUS: 'Present' },
    { ATT_ID: 4, EMP_ID: 1003, ATT_DATE: '2025-06-02', CLOCK_IN: null, CLOCK_OUT: null, TOTAL_HOURS: 0, OVERTIME_HRS: 0, STATUS: 'Absent' }
  ],
  payroll: [
    { PAY_ID: 1, EMP_ID: 1001, PAY_MONTH: '2025-06', WORKING_DAYS: 22, DAYS_PRESENT: 20, BASE_PAY: 85000, HRA: 17000, DA: 8500, TRANSPORT: 1500, OVERTIME_PAY: 4500, BONUS: 0, GROSS_SALARY: 111500, PF_DEDUCTION: 10200, TAX: 7500, INSURANCE: 500, TOTAL_DEDUCT: 18200, NET_SALARY: 93300, PAY_DATE: '2025-06-30', STATUS: 'Paid' }
  ],
  leaves: [
    { LEAVE_ID: 1, EMP_ID: 1003, LEAVE_TYPE: 'Casual', START_DATE: '2025-06-10', END_DATE: '2025-06-12', TOTAL_DAYS: 3, APPROVAL: 'Pending' }
  ],
  performance: [
    { REVIEW_ID: 1, EMP_ID: 1001, REVIEW_PERIOD: '2025-H1', REVIEWER_ID: 1005, RATING: 4.5, COMMUNICATION: 4.0, TECHNICAL: 5.0, TEAMWORK: 4.5, PUNCTUALITY: 4.0, STRENGTHS: 'Excellent coding skills, strong problem solving', RECOMMENDATION: 'Promote' }
  ],
  auditLog: []
};

const dbConfig = {
  user: process.env.DB_USER || 'ems_admin',
  password: process.env.DB_PASSWORD || 'password123',
  connectString: process.env.DB_CONNECT || 'localhost:1521/XEPDB1',
  poolMin: 2,
  poolMax: 10
};

let pool = null;
let mockMode = false;

async function initialize() {
  try {
    pool = await oracledb.createPool(dbConfig);
    console.log('✅ Oracle Database connected successfully');
    mockMode = false;
  } catch (err) {
    console.warn('⚠️ Oracle not available. Falling back to mock in-memory data.');
    mockMode = true;
    pool = null;
  }
}

async function close() {
  if (pool) {
    await pool.close(0);
  }
}

async function execute(sql, binds = {}, options = {}) {
  if (mockMode) {
    return { rows: [], metadata: [], outBinds: {} };
  }

  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    return result;
  } catch (err) {
    console.error('DB Error:', err.message);
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

function getMockData() {
  return mockData;
}

module.exports = { initialize, close, execute, getMockData, mockMode };
