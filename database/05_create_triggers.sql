CREATE OR REPLACE TRIGGER trg_audit_employees
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW
DECLARE
  v_action VARCHAR2(10);
  v_id NUMBER;
  v_old VARCHAR2(4000);
  v_new VARCHAR2(4000);
BEGIN
  IF INSERTING THEN
    v_action := 'INSERT'; v_id := :NEW.emp_id;
    v_old := NULL;
    v_new := 'Name=' || :NEW.first_name || ' ' || :NEW.last_name || ', Dept=' || :NEW.department_id || ', Salary=' || :NEW.base_salary || ', Status=' || :NEW.status;
  ELSIF UPDATING THEN
    v_action := 'UPDATE'; v_id := :NEW.emp_id;
    v_old := 'Name=' || :OLD.first_name || ' ' || :OLD.last_name || ', Dept=' || :OLD.department_id || ', Salary=' || :OLD.base_salary || ', Status=' || :OLD.status;
    v_new := 'Name=' || :NEW.first_name || ' ' || :NEW.last_name || ', Dept=' || :NEW.department_id || ', Salary=' || :NEW.base_salary || ', Status=' || :NEW.status;
  ELSIF DELETING THEN
    v_action := 'DELETE'; v_id := :OLD.emp_id;
    v_old := 'Name=' || :OLD.first_name || ' ' || :OLD.last_name || ', Dept=' || :OLD.department_id || ', Salary=' || :OLD.base_salary || ', Status=' || :OLD.status;
    v_new := NULL;
  END IF;

  INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
  VALUES ('EMPLOYEES', v_id, v_action, v_old, v_new);
END;
/

CREATE OR REPLACE TRIGGER trg_audit_payroll
AFTER INSERT OR UPDATE ON payroll
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
  VALUES ('PAYROLL', :NEW.pay_id,
          CASE WHEN INSERTING THEN 'INSERT' ELSE 'UPDATE' END,
          CASE WHEN UPDATING THEN 'Net=' || :OLD.net_salary END,
          'Month=' || :NEW.pay_month || ', Net=' || :NEW.net_salary);
END;
/

CREATE OR REPLACE TRIGGER trg_emp_update_date
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
  :NEW.updated_date := SYSDATE;
END;
/
