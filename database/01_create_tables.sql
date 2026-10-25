-- Employee Management System - Schema Creation
BEGIN
  FOR rec IN (
    SELECT table_name
    FROM user_tables
    WHERE table_name IN (
      'AUDIT_LOG','PERFORMANCE_REVIEWS','SALARY_ADVANCES','PAYROLL','LEAVES','ATTENDANCE','USERS','EMPLOYEES','DEPARTMENTS'
    )
  )
  LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || rec.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

CREATE TABLE departments (
  dept_id NUMBER PRIMARY KEY,
  dept_name VARCHAR2(50) NOT NULL UNIQUE,
  location VARCHAR2(100),
  manager_id NUMBER,
  created_date DATE DEFAULT SYSDATE,
  is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y','N'))
);

CREATE TABLE employees (
  emp_id NUMBER PRIMARY KEY,
  first_name VARCHAR2(30) NOT NULL,
  last_name VARCHAR2(30) NOT NULL,
  email VARCHAR2(60) UNIQUE NOT NULL,
  phone VARCHAR2(15),
  date_of_birth DATE,
  gender VARCHAR2(10) CHECK (gender IN ('Male','Female','Other')),
  address VARCHAR2(200),
  hire_date DATE DEFAULT SYSDATE,
  department_id NUMBER REFERENCES departments(dept_id),
  designation VARCHAR2(50),
  base_salary NUMBER(12,2),
  photo_url VARCHAR2(300),
  status VARCHAR2(15) DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Terminated','On Leave')),
  created_date DATE DEFAULT SYSDATE,
  updated_date DATE DEFAULT SYSDATE
);

ALTER TABLE departments ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES employees(emp_id);

CREATE TABLE users (
  user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emp_id NUMBER REFERENCES employees(emp_id),
  username VARCHAR2(30) UNIQUE NOT NULL,
  password_hash VARCHAR2(256) NOT NULL,
  role VARCHAR2(20) DEFAULT 'Employee' CHECK (role IN ('Admin','HR','Manager','Employee')),
  last_login TIMESTAMP,
  is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y','N')),
  created_date DATE DEFAULT SYSDATE
);

CREATE TABLE attendance (
  att_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emp_id NUMBER REFERENCES employees(emp_id),
  att_date DATE DEFAULT TRUNC(SYSDATE),
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  total_hours NUMBER(5,2) DEFAULT 0,
  overtime_hrs NUMBER(5,2) DEFAULT 0,
  status VARCHAR2(15) DEFAULT 'Present' CHECK (status IN ('Present','Absent','Half-Day','On Leave','Holiday')),
  notes VARCHAR2(200)
);
CREATE UNIQUE INDEX idx_att_unique ON attendance(emp_id, att_date);

CREATE TABLE leaves (
  leave_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emp_id NUMBER REFERENCES employees(emp_id),
  leave_type VARCHAR2(20) CHECK (leave_type IN ('Sick','Casual','Earned','Maternity','Paternity','Unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMBER(3) DEFAULT 1,
  reason VARCHAR2(300),
  approval VARCHAR2(15) DEFAULT 'Pending' CHECK (approval IN ('Pending','Approved','Rejected')),
  approved_by NUMBER REFERENCES employees(emp_id),
  applied_on DATE DEFAULT SYSDATE
);

CREATE TABLE payroll (
  pay_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emp_id NUMBER REFERENCES employees(emp_id),
  pay_month VARCHAR2(7) NOT NULL,
  working_days NUMBER(3) DEFAULT 22,
  days_present NUMBER(3) DEFAULT 0,
  base_pay NUMBER(12,2),
  hra NUMBER(12,2) DEFAULT 0,
  da NUMBER(12,2) DEFAULT 0,
  transport NUMBER(12,2) DEFAULT 0,
  overtime_pay NUMBER(12,2) DEFAULT 0,
  bonus NUMBER(12,2) DEFAULT 0,
  gross_salary NUMBER(12,2),
  pf_deduction NUMBER(12,2) DEFAULT 0,
  tax NUMBER(12,2) DEFAULT 0,
  insurance NUMBER(12,2) DEFAULT 0,
  advance_deduct NUMBER(12,2) DEFAULT 0,
  total_deduct NUMBER(12,2) DEFAULT 0,
  net_salary NUMBER(12,2),
  pay_date DATE DEFAULT SYSDATE,
  status VARCHAR2(15) DEFAULT 'Generated' CHECK (status IN ('Generated','Approved','Paid'))
);
CREATE UNIQUE INDEX idx_payroll_unique ON payroll(emp_id, pay_month);

CREATE TABLE salary_advances (
  advance_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emp_id NUMBER REFERENCES employees(emp_id),
  amount NUMBER(12,2) NOT NULL,
  reason VARCHAR2(300),
  request_date DATE DEFAULT SYSDATE,
  approval VARCHAR2(15) DEFAULT 'Pending' CHECK (approval IN ('Pending','Approved','Rejected')),
  approved_by NUMBER REFERENCES employees(emp_id),
  repayment_months NUMBER DEFAULT 3,
  monthly_deduction NUMBER(12,2),
  remaining_amount NUMBER(12,2)
);

CREATE TABLE performance_reviews (
  review_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emp_id NUMBER REFERENCES employees(emp_id),
  review_period VARCHAR2(20) NOT NULL,
  reviewer_id NUMBER REFERENCES employees(emp_id),
  rating NUMBER(2,1) CHECK (rating BETWEEN 1.0 AND 5.0),
  communication NUMBER(2,1) CHECK (communication BETWEEN 1.0 AND 5.0),
  technical NUMBER(2,1) CHECK (technical BETWEEN 1.0 AND 5.0),
  teamwork NUMBER(2,1) CHECK (teamwork BETWEEN 1.0 AND 5.0),
  punctuality NUMBER(2,1) CHECK (punctuality BETWEEN 1.0 AND 5.0),
  strengths VARCHAR2(500),
  improvements VARCHAR2(500),
  goals VARCHAR2(500),
  recommendation VARCHAR2(30) CHECK (recommendation IN ('Promote','Bonus','Training','PIP','None')),
  created_at DATE DEFAULT SYSDATE
);

CREATE TABLE audit_log (
  audit_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name VARCHAR2(50),
  record_id NUMBER,
  action VARCHAR2(10),
  old_values VARCHAR2(500),
  new_values VARCHAR2(500),
  change_time TIMESTAMP DEFAULT SYSTIMESTAMP
);
