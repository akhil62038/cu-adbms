CREATE OR REPLACE FUNCTION fn_get_employee_name(p_emp_id NUMBER) RETURN VARCHAR2 IS
  v_name VARCHAR2(120);
BEGIN
  SELECT first_name || ' ' || last_name INTO v_name
  FROM employees WHERE emp_id = p_emp_id;
  RETURN v_name;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN 'Unknown Employee';
END;
/

CREATE OR REPLACE FUNCTION fn_get_monthly_attendance(p_emp_id NUMBER, p_month VARCHAR2) RETURN NUMBER IS
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM attendance
  WHERE emp_id = p_emp_id
    AND TO_CHAR(att_date, 'YYYY-MM') = p_month
    AND status IN ('Present','Half-Day');
  RETURN v_count;
END;
/
