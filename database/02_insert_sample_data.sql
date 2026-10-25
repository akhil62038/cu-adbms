INSERT INTO departments (dept_id, dept_name, location, manager_id) VALUES (10, 'Information Technology', 'Building A - Floor 1', NULL);
INSERT INTO departments (dept_id, dept_name, location, manager_id) VALUES (20, 'Human Resources', 'Building B - Floor 1', NULL);
INSERT INTO departments (dept_id, dept_name, location, manager_id) VALUES (30, 'Finance', 'Building A - Floor 2', NULL);
INSERT INTO departments (dept_id, dept_name, location, manager_id) VALUES (40, 'Marketing', 'Building C - Floor 1', NULL);
INSERT INTO departments (dept_id, dept_name, location, manager_id) VALUES (50, 'Operations', 'Building D - Floor 1', NULL);

INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1001, 'Amit', 'Sharma', 'amit.sharma@company.com', '9876543210', TO_DATE('1990-05-15','YYYY-MM-DD'), 'Male', TO_DATE('2020-01-15','YYYY-MM-DD'), 10, 'Senior Developer', 85000, 'Active');
INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1002, 'Priya', 'Patel', 'priya.patel@company.com', '9123456789', TO_DATE('1988-11-20','YYYY-MM-DD'), 'Female', TO_DATE('2019-06-01','YYYY-MM-DD'), 20, 'HR Manager', 78000, 'Active');
INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1003, 'Rahul', 'Verma', 'rahul.verma@company.com', '9988776655', TO_DATE('1995-03-10','YYYY-MM-DD'), 'Male', TO_DATE('2022-08-20','YYYY-MM-DD'), 10, 'Junior Developer', 42000, 'Active');
INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1004, 'Sneha', 'Gupta', 'sneha.gupta@company.com', '9001122334', TO_DATE('1992-07-25','YYYY-MM-DD'), 'Female', TO_DATE('2021-03-15','YYYY-MM-DD'), 30, 'Senior Accountant', 62000, 'Active');
INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1005, 'Vikram', 'Singh', 'vikram.singh@company.com', '9112233445', TO_DATE('1987-12-05','YYYY-MM-DD'), 'Male', TO_DATE('2018-01-10','YYYY-MM-DD'), 40, 'Marketing Director', 95000, 'Active');
INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1006, 'Ananya', 'Reddy', 'ananya.reddy@company.com', '9223344556', TO_DATE('1993-09-18','YYYY-MM-DD'), 'Female', TO_DATE('2021-11-01','YYYY-MM-DD'), 10, 'Full Stack Developer', 72000, 'Active');
INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1007, 'Karan', 'Mehta', 'karan.mehta@company.com', '9334455667', TO_DATE('1994-02-28','YYYY-MM-DD'), 'Male', TO_DATE('2023-04-10','YYYY-MM-DD'), 50, 'Operations Analyst', 48000, 'Active');
INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, hire_date, department_id, designation, base_salary, status)
VALUES (1008, 'Deepika', 'Nair', 'deepika.nair@company.com', '9445566778', TO_DATE('1991-06-12','YYYY-MM-DD'), 'Female', TO_DATE('2020-09-01','YYYY-MM-DD'), 20, 'HR Executive', 45000, 'Active');

UPDATE departments SET manager_id = 1001 WHERE dept_id = 10;
UPDATE departments SET manager_id = 1002 WHERE dept_id = 20;
UPDATE departments SET manager_id = 1004 WHERE dept_id = 30;
UPDATE departments SET manager_id = 1005 WHERE dept_id = 40;
UPDATE departments SET manager_id = 1007 WHERE dept_id = 50;

INSERT INTO users (emp_id, username, password_hash, role) VALUES (1001, 'amit.sharma', 'hashed_Pass@123', 'Manager');
INSERT INTO users (emp_id, username, password_hash, role) VALUES (1002, 'priya.patel', 'hashed_Pass@123', 'HR');
INSERT INTO users (emp_id, username, password_hash, role) VALUES (1003, 'rahul.verma', 'hashed_Pass@123', 'Employee');
INSERT INTO users (emp_id, username, password_hash, role) VALUES (1004, 'sneha.gupta', 'hashed_Pass@123', 'Employee');
INSERT INTO users (emp_id, username, password_hash, role) VALUES (1005, 'vikram.singh', 'hashed_Pass@123', 'Manager');

INSERT INTO attendance (emp_id, att_date, clock_in, clock_out, total_hours, overtime_hrs, status)
VALUES (1001, TRUNC(SYSDATE)-4, TRUNC(SYSDATE)-4 + 9/24, TRUNC(SYSDATE)-4 + 18/24, 9.0, 1.0, 'Present');
INSERT INTO attendance (emp_id, att_date, clock_in, clock_out, total_hours, overtime_hrs, status)
VALUES (1001, TRUNC(SYSDATE)-3, TRUNC(SYSDATE)-3 + 9/24, TRUNC(SYSDATE)-3 + 17.5/24, 8.5, 0.5, 'Present');
INSERT INTO attendance (emp_id, att_date, clock_in, clock_out, total_hours, overtime_hrs, status)
VALUES (1003, TRUNC(SYSDATE)-4, TRUNC(SYSDATE)-4 + 10/24, TRUNC(SYSDATE)-4 + 18/24, 8.0, 0, 'Present');
INSERT INTO attendance (emp_id, att_date, clock_in, clock_out, total_hours, overtime_hrs, status)
VALUES (1003, TRUNC(SYSDATE)-3, NULL, NULL, 0, 0, 'Absent');

INSERT INTO performance_reviews (emp_id, review_period, reviewer_id, rating, communication, technical, teamwork, punctuality, strengths, improvements, recommendation)
VALUES (1001, '2025-H1', 1005, 4.5, 4.0, 5.0, 4.5, 4.0, 'Excellent coding skills, strong problem solving', 'Could improve documentation habits', 'Promote');
INSERT INTO performance_reviews (emp_id, review_period, reviewer_id, rating, communication, technical, teamwork, punctuality, strengths, improvements, recommendation)
VALUES (1003, '2025-H1', 1001, 3.8, 3.5, 4.0, 4.0, 3.5, 'Quick learner, good team player', 'Needs to improve time management', 'Training');

COMMIT;
