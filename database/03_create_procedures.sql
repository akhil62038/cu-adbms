CREATE OR REPLACE PROCEDURE sp_add_employee (
  p_first_name IN VARCHAR2,
  p_last_name IN VARCHAR2,
  p_email IN VARCHAR2,
  p_phone IN VARCHAR2,
  p_dob IN DATE DEFAULT NULL,
  p_gender IN VARCHAR2 DEFAULT NULL,
  p_address IN VARCHAR2 DEFAULT NULL,
  p_dept_id IN NUMBER,
  p_designation IN VARCHAR2,
  p_base_salary IN NUMBER,
  p_emp_id OUT NUMBER,
  p_status OUT VARCHAR2,
  p_message OUT VARCHAR2
) IS
  v_dept_count NUMBER;
  v_email_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_dept_count
  FROM departments WHERE dept_id = p_dept_id AND is_active = 'Y';
  IF v_dept_count = 0 THEN
    p_status := 'ERROR'; p_message := 'Invalid department'; RETURN;
  END IF;

  SELECT COUNT(*) INTO v_email_count FROM employees WHERE LOWER(email) = LOWER(p_email);
  IF v_email_count > 0 THEN
    p_status := 'ERROR'; p_message := 'Duplicate email'; RETURN;
  END IF;

  IF p_base_salary < 15000 THEN
    p_status := 'ERROR'; p_message := 'Salary too low'; RETURN;
  END IF;

  p_emp_id := emp_seq.NEXTVAL;
  INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, address, hire_date, department_id, designation, base_salary)
  VALUES (p_emp_id, p_first_name, p_last_name, p_email, p_phone, p_dob, p_gender, p_address, SYSDATE, p_dept_id, p_designation, p_base_salary);

  INSERT INTO users (emp_id, username, password_hash, role)
  VALUES (p_emp_id, LOWER(p_first_name || '.' || p_last_name), 'hashed_TempPass@123', 'Employee');

  COMMIT;
  p_status := 'SUCCESS'; p_message := 'Employee added successfully.';
END;
/

CREATE OR REPLACE PROCEDURE sp_clock_in (
  p_emp_id IN NUMBER,
  p_status OUT VARCHAR2,
  p_message OUT VARCHAR2
) IS
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM attendance WHERE emp_id = p_emp_id AND att_date = TRUNC(SYSDATE);
  IF v_count > 0 THEN
    p_status := 'ERROR'; p_message := 'Already clocked in today.'; RETURN;
  END IF;

  INSERT INTO attendance (emp_id, att_date, clock_in, status) VALUES (p_emp_id, TRUNC(SYSDATE), SYSTIMESTAMP, 'Present');
  COMMIT;
  p_status := 'SUCCESS'; p_message := 'Clocked in successfully.';
END;
/

CREATE OR REPLACE PROCEDURE sp_clock_out (
  p_emp_id IN NUMBER,
  p_status OUT VARCHAR2,
  p_message OUT VARCHAR2,
  p_hours OUT NUMBER,
  p_overtime OUT NUMBER
) IS
  v_clock_in TIMESTAMP;
BEGIN
  SELECT clock_in INTO v_clock_in FROM attendance WHERE emp_id = p_emp_id AND att_date = TRUNC(SYSDATE) AND clock_out IS NULL;
  p_hours := ROUND(EXTRACT(HOUR FROM (SYSTIMESTAMP - v_clock_in)) + EXTRACT(MINUTE FROM (SYSTIMESTAMP - v_clock_in)) / 60, 2);
  p_overtime := CASE WHEN p_hours > 8 THEN ROUND(p_hours - 8, 2) ELSE 0 END;

  UPDATE attendance SET clock_out = SYSTIMESTAMP, total_hours = p_hours, overtime_hrs = p_overtime,
      status = CASE WHEN p_hours < 4 THEN 'Half-Day' ELSE 'Present' END
  WHERE emp_id = p_emp_id AND att_date = TRUNC(SYSDATE) AND clock_out IS NULL;

  COMMIT;
  p_status := 'SUCCESS'; p_message := 'Clocked out successfully.';
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_status := 'ERROR'; p_message := 'No active clock-in found.'; p_hours := 0; p_overtime := 0;
END;
/

CREATE OR REPLACE PROCEDURE sp_calculate_salary (
  p_emp_id IN NUMBER,
  p_month IN VARCHAR2,
  p_status OUT VARCHAR2,
  p_message OUT VARCHAR2
) IS
  v_base NUMBER(12,2);
  v_hra NUMBER(12,2);
  v_da NUMBER(12,2);
  v_transport NUMBER(12,2);
  v_ot_hours NUMBER(6,2);
  v_gross NUMBER(12,2);
  v_pf NUMBER(12,2);
  v_tax NUMBER(12,2);
  v_insurance NUMBER(12,2);
  v_ded NUMBER(12,2);
  v_net NUMBER(12,2);
  v_days_present NUMBER(3);
  v_ot_pay NUMBER(12,2);
BEGIN
  SELECT base_salary INTO v_base FROM employees WHERE emp_id = p_emp_id AND status = 'Active';
  SELECT COUNT(*) INTO v_days_present FROM attendance WHERE emp_id = p_emp_id AND TO_CHAR(att_date, 'YYYY-MM') = p_month AND status IN ('Present', 'Half-Day');
  SELECT NVL(SUM(overtime_hrs), 0) INTO v_ot_hours FROM attendance WHERE emp_id = p_emp_id AND TO_CHAR(att_date, 'YYYY-MM') = p_month;

  v_hra := ROUND(v_base * 0.20, 2);
  v_da := ROUND(v_base * 0.10, 2);
  v_transport := 1500;
  v_ot_pay := ROUND(v_ot_hours * (v_base / 22 / 8) * 1.5, 2);
  v_gross := v_base + v_hra + v_da + v_transport + v_ot_pay;

  v_pf := ROUND(v_base * 0.12, 2);
  v_insurance := 500;
  v_tax := CASE
      WHEN v_base * 12 > 1500000 THEN ROUND(v_base * 0.30, 2)
      WHEN v_base * 12 > 1200000 THEN ROUND(v_base * 0.20, 2)
      WHEN v_base * 12 > 900000 THEN ROUND(v_base * 0.15, 2)
      WHEN v_base * 12 > 600000 THEN ROUND(v_base * 0.10, 2)
      WHEN v_base * 12 > 300000 THEN ROUND(v_base * 0.05, 2)
      ELSE 0
  END;

  v_ded := v_pf + v_tax + v_insurance;
  v_net := v_gross - v_ded;

  INSERT INTO payroll (emp_id, pay_month, working_days, days_present, base_pay, hra, da, transport, overtime_pay, bonus, gross_salary, pf_deduction, tax, insurance, total_deduct, net_salary)
  VALUES (p_emp_id, p_month, 22, v_days_present, v_base, v_hra, v_da, v_transport, v_ot_pay, 0, v_gross, v_pf, v_tax, v_insurance, v_ded, v_net);

  COMMIT;
  p_status := 'SUCCESS'; p_message := 'Payroll generated. Net salary: ' || v_net;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_status := 'ERROR'; p_message := 'Active employee not found: ' || p_emp_id;
END;
/
