CREATE OR REPLACE PACKAGE emp_pkg AS
  PROCEDURE sp_add_employee (
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
  );

  PROCEDURE sp_terminate_employee (
    p_emp_id IN NUMBER,
    p_status OUT VARCHAR2,
    p_message OUT VARCHAR2
  );
END emp_pkg;
/

CREATE OR REPLACE PACKAGE BODY emp_pkg AS
  PROCEDURE sp_add_employee (
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
  BEGIN
    INSERT INTO employees (emp_id, first_name, last_name, email, phone, date_of_birth, gender, address, hire_date, department_id, designation, base_salary)
    VALUES (emp_seq.NEXTVAL, p_first_name, p_last_name, p_email, p_phone, p_dob, p_gender, p_address, SYSDATE, p_dept_id, p_designation, p_base_salary)
    RETURNING emp_id INTO p_emp_id;

    INSERT INTO users (emp_id, username, password_hash, role)
    VALUES (p_emp_id, LOWER(p_first_name || '.' || p_last_name), 'hashed_TempPass@123', 'Employee');

    COMMIT;
    p_status := 'SUCCESS'; p_message := 'Employee added via package.';
  END;

  PROCEDURE sp_terminate_employee (
    p_emp_id IN NUMBER,
    p_status OUT VARCHAR2,
    p_message OUT VARCHAR2
  ) IS
    v_name VARCHAR2(60);
  BEGIN
    SELECT first_name || ' ' || last_name INTO v_name FROM employees WHERE emp_id = p_emp_id;
    UPDATE employees SET status = 'Terminated', updated_date = SYSDATE WHERE emp_id = p_emp_id;
    UPDATE users SET is_active = 'N' WHERE emp_id = p_emp_id;
    COMMIT;
    p_status := 'SUCCESS'; p_message := v_name || ' has been terminated.';
  END;
END emp_pkg;
/
