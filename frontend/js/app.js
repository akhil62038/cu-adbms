const API_BASE = '/api';
let currentUser = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  toast.replaceChildren();
  const iconElement = document.createElement('i');
  iconElement.className = `fas fa-${icon}`;
  toast.append(iconElement, document.createTextNode(` ${message}`));
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

function showLoading() {
  return '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
}

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function getInitials(name) {
  return String(name || '').split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function badgeClass(status) {
  const map = {
    Active: 'badge-active',
    Present: 'badge-present',
    Absent: 'badge-absent',
    'Half-Day': 'badge-half-day',
    'On Leave': 'badge-on-leave',
    Pending: 'badge-pending',
    Approved: 'badge-approved',
    Rejected: 'badge-rejected',
    Generated: 'badge-info',
    Paid: 'badge-approved'
  };
  return map[status] || 'badge-info';
}

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    showToast(err.message || 'Network error. Please try again.', 'error');
    return { status: 'ERROR', message: err.message || 'Network error' };
  }
}

function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeModal();
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  if (result.status === 'SUCCESS') {
    currentUser = result.user;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.FULL_NAME;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('userAvatar').textContent = getInitials(currentUser.FULL_NAME);
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    showToast(`Welcome back, ${currentUser.FULL_NAME}!`);
    loadPage('dashboard');
  } else {
    errorDiv.style.display = 'block';
    errorDiv.textContent = result.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').style.display = 'none';
});

document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    document.querySelectorAll('.nav-item').forEach((nav) => nav.classList.remove('active'));
    item.classList.add('active');
    loadPage(page);
    document.querySelector('.sidebar').classList.remove('open');
  });
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

async function loadPage(page) {
  const content = document.getElementById('contentArea');
  const titleMap = {
    dashboard: 'Dashboard',
    employees: 'Employee Management',
    attendance: 'Attendance Management',
    payroll: 'Payroll Management',
    performance: 'Performance Evaluation',
    audit: 'Audit Log'
  };

  document.getElementById('pageTitle').textContent = titleMap[page] || page;
  content.innerHTML = showLoading();

  switch (page) {
    case 'dashboard': await loadDashboard(); break;
    case 'employees': await loadEmployees(); break;
    case 'attendance': await loadAttendance(); break;
    case 'payroll': await loadPayroll(); break;
    case 'performance': await loadPerformance(); break;
    case 'audit': await loadAudit(); break;
  }
}

async function loadDashboard() {
  const result = await apiCall('/dashboard');
  if (result.status !== 'SUCCESS') return;
  const stats = result.data;

  const html = `
    <div class="stats-grid">
      <div class="metric-card">
        <div class="metric-head">
          <h3>Total Employees</h3>
          <div class="metric-icon primary"><i class="fas fa-users"></i></div>
        </div>
        <div class="metric-value">${stats.totalEmployees}</div>
        <div class="metric-trend">+2.4% vs last month</div>
      </div>
      <div class="metric-card">
        <div class="metric-head">
          <h3>Departments</h3>
          <div class="metric-icon success"><i class="fas fa-building"></i></div>
        </div>
        <div class="metric-value">${stats.totalDepartments}</div>
        <div class="metric-trend">Across all offices</div>
      </div>
      <div class="metric-card">
        <div class="metric-head">
          <h3>Present Today</h3>
          <div class="metric-icon warning"><i class="fas fa-clock"></i></div>
        </div>
        <div class="metric-value">${stats.todayPresent}</div>
        <div class="metric-trend">Current attendance</div>
      </div>
      <div class="metric-card">
        <div class="metric-head">
          <h3>Pending Leave</h3>
          <div class="metric-icon info"><i class="fas fa-calendar-alt"></i></div>
        </div>
        <div class="metric-value">${stats.pendingLeaves}</div>
        <div class="metric-trend">Awaiting approval</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 22px;">
      <div class="card">
        <div class="section-header">
          <h3>Department Distribution</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Department</th><th>Employees</th></tr>
            </thead>
            <tbody>
              ${stats.departmentStats.map((row) => `<tr><td>${row.DEPT_NAME}</td><td>${row.EMP_COUNT}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <h3>Recent Activity</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Table</th><th>Action</th><th>Details</th><th>Time</th></tr>
            </thead>
            <tbody>
              ${(stats.recentActivity || []).map((row) => `<tr><td>${row.table_name}</td><td><span class="badge badge-info">${row.action}</span></td><td>${row.new_values}</td><td>${row.time_str}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contentArea').innerHTML = html;
}

async function loadEmployees() {
  const result = await apiCall('/employees');
  if (result.status !== 'SUCCESS') return;

  const employees = result.data || [];
  const html = `
    <div class="card">
      <div class="filters-bar">
        <div class="search-box"><input id="employeeSearch" type="text" placeholder="Search employee..." /></div>
        <div class="toolbar-actions">
          <select id="employeeStatusFilter">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
          <button class="btn btn-primary" onclick="openEmployeeForm()">Add Employee</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Employee</th><th>Phone</th><th>Address</th><th>Department</th><th>Designation</th><th>Salary</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${employees.length ? employees.map((emp) => `
              <tr>
                <td>${emp.EMP_ID}</td>
                <td><strong>${escapeHtml(emp.FULL_NAME)}</strong><br><small>${escapeHtml(emp.EMAIL)}</small></td>
                <td>${escapeHtml(emp.PHONE)}</td>
                <td>${escapeHtml(emp.ADDRESS)}</td>
                <td>${escapeHtml(emp.DEPT_NAME)}</td>
                <td>${escapeHtml(emp.DESIGNATION)}</td>
                <td>${formatCurrency(emp.BASE_SALARY)}</td>
                <td><span class="badge ${badgeClass(emp.STATUS)}">${emp.STATUS}</span></td>
                <td><div class="toolbar-actions">
                  <button class="btn btn-primary" onclick="openEmployeeForm(${emp.EMP_ID})">Edit</button>
                  <button class="btn btn-danger" onclick="deleteEmployee(${emp.EMP_ID})">Delete</button>
                </div></td>
              </tr>
            `).join('') : `<tr><td colspan="9"><div class="empty-state">No employees found.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('contentArea').innerHTML = html;
  document.getElementById('employeeSearch').addEventListener('input', filterEmployees);
  document.getElementById('employeeStatusFilter').addEventListener('change', filterEmployees);
}

function filterEmployees() {
  const query = (document.getElementById('employeeSearch')?.value || '').toLowerCase();
  const status = document.getElementById('employeeStatusFilter')?.value || '';
  document.querySelectorAll('#contentArea tbody tr').forEach((row) => {
    if (row.querySelector('td[colspan]')) return;
    const hasQuery = !query || row.textContent.toLowerCase().includes(query);
    const statusCell = row.querySelector('td:nth-child(8)')?.textContent.trim() || '';
    row.style.display = hasQuery && (!status || statusCell === status) ? '' : 'none';
  });
}

async function openEmployeeForm(employeeId = null) {
  const [employeesResult] = await Promise.all([apiCall('/employees')]);
  if (employeesResult.status !== 'SUCCESS') return;
  const employee = employeeId ? employeesResult.data.find((item) => item.EMP_ID === employeeId) : null;
  if (employeeId && !employee) {
    showToast('Employee record could not be loaded.', 'error');
    return;
  }
  const departments = [
    { id: 10, name: 'Information Technology' },
    { id: 20, name: 'Human Resources' },
    { id: 30, name: 'Finance' },
    { id: 40, name: 'Marketing' },
    { id: 50, name: 'Operations' }
  ];
  const departmentOptions = departments.map((department) =>
    `<option value="${department.id}" ${employee?.DEPARTMENT_ID === department.id ? 'selected' : ''}>${department.name}</option>`
  ).join('');
  const statusOptions = ['Active', 'Inactive', 'On Leave', 'Terminated'].map((status) =>
    `<option value="${status}" ${employee?.STATUS === status ? 'selected' : ''}>${status}</option>`
  ).join('');
  openModal(employee ? 'Edit Employee' : 'Add Employee', `
    <form id="employeeForm" class="login-form" data-employee-id="${employee?.EMP_ID || ''}">
      <div class="grid-2">
        <div class="form-group"><label>First Name</label><input name="first_name" value="${escapeHtml(employee?.FIRST_NAME)}" required /></div>
        <div class="form-group"><label>Last Name</label><input name="last_name" value="${escapeHtml(employee?.LAST_NAME)}" required /></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Email</label><input name="email" type="email" value="${escapeHtml(employee?.EMAIL)}" required /></div>
        <div class="form-group"><label>Phone Number</label><input name="phone" type="tel" value="${escapeHtml(employee?.PHONE)}" required /></div>
      </div>
      <div class="form-group"><label>Address</label><input name="address" value="${escapeHtml(employee?.ADDRESS)}" required /></div>
      <div class="grid-2">
        <div class="form-group"><label>Department</label><select name="department_id" required>${departmentOptions}</select></div>
        <div class="form-group"><label>Designation</label><input name="designation" value="${escapeHtml(employee?.DESIGNATION)}" required /></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Base Monthly Salary (₹)</label><input name="base_salary" type="number" min="0" step="0.01" value="${employee?.BASE_SALARY ?? ''}" required /></div>
        <div class="form-group"><label>Status</label><select name="status">${statusOptions}</select></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Date of Birth</label><input name="date_of_birth" type="date" value="${escapeHtml(employee?.DATE_OF_BIRTH)}" /></div>
        <div class="form-group"><label>Hire Date</label><input name="hire_date" type="date" value="${escapeHtml(employee?.HIRE_DATE)}" /></div>
      </div>
      <div class="form-group"><label>Gender</label><select name="gender">
        ${['Other', 'Male', 'Female'].map((gender) => `<option value="${gender}" ${employee?.GENDER === gender ? 'selected' : ''}>${gender}</option>`).join('')}
      </select></div>
      <button type="submit" class="btn btn-primary btn-full">${employee ? 'Save Changes' : 'Add Employee'}</button>
    </form>
  `);
}

async function deleteEmployee(employeeId) {
  const employee = await apiCall(`/employees/${employeeId}`);
  if (employee.status !== 'SUCCESS') return;
  if (!confirm(`Delete ${employee.data.FULL_NAME}? Related attendance, performance and payroll sample records will also be removed.`)) return;
  const result = await apiCall(`/employees/${employeeId}`, { method: 'DELETE' });
  if (result.status === 'SUCCESS') {
    showToast(result.message);
    loadPage('employees');
  }
}

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.id === 'employeeForm') {
    event.preventDefault();
    const employeeId = form.dataset.employeeId;
    const result = await apiCall(employeeId ? `/employees/${employeeId}` : '/employees', {
      method: employeeId ? 'PUT' : 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    if (result.status === 'SUCCESS') {
      closeModal();
      showToast(result.message);
      loadPage('employees');
    }
  }
});

async function loadAttendance() {
  const result = await apiCall('/attendance');
  if (result.status !== 'SUCCESS') return;
  const rows = result.data || [];

  const html = `
    <div class="card">
      <div class="section-header">
        <h3>Attendance Records</h3>
        <div class="toolbar-actions">
          <button class="btn btn-primary" onclick="openAttendanceForm()">Mark Attendance</button>
          <button class="btn btn-primary" onclick="clockIn()">Clock In</button>
          <button class="btn btn-primary" onclick="clockOut()">Clock Out</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Total Hrs</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.FULL_NAME)}</td>
                <td>${escapeHtml(row.ATT_DATE)}</td>
                <td>${row.CLOCK_IN ? new Date(row.CLOCK_IN).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                <td>${row.CLOCK_OUT ? new Date(row.CLOCK_OUT).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                <td>${row.TOTAL_HOURS || 0}</td>
                <td><span class="badge ${badgeClass(row.STATUS)}">${escapeHtml(row.STATUS)}</span></td>
                <td>${escapeHtml(row.NOTES)}</td>
                <td><div class="toolbar-actions">
                  <button class="btn btn-primary" onclick="editAttendance(${row.ATT_ID})">Edit</button>
                  <button class="btn btn-danger" onclick="deleteAttendance(${row.ATT_ID})">Delete</button>
                </div></td>
              </tr>
            `).join('') : `<tr><td colspan="8"><div class="empty-state">No attendance data.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('contentArea').innerHTML = html;
}

async function openAttendanceForm() {
  const result = await apiCall('/employees?status=Active');
  if (result.status !== 'SUCCESS') return;
  const employeeOptions = result.data.map((employee) =>
    `<option value="${employee.EMP_ID}">${employee.EMP_ID} - ${escapeHtml(employee.FULL_NAME)}</option>`
  ).join('');
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  openModal('Mark Attendance', `
    <form id="attendanceForm" class="login-form">
      <div class="form-group"><label>Employee</label><select name="emp_id" required>${employeeOptions}</select></div>
      <div class="grid-2">
        <div class="form-group"><label>Date</label><input name="date" type="date" value="${localDate}" required /></div>
        <div class="form-group"><label>Status</label><select name="status" required>
          <option value="Present">Present</option><option value="Absent">Absent</option>
          <option value="Half-Day">Half-Day</option><option value="On Leave">On Leave</option>
          <option value="Holiday">Holiday</option>
        </select></div>
      </div>
      <div class="form-group"><label>Notes</label><input name="notes" maxlength="200" placeholder="Optional note" /></div>
      <button type="submit" class="btn btn-primary btn-full">Save Attendance</button>
    </form>
  `);
}

async function editAttendance(attendanceId) {
  const result = await apiCall('/attendance');
  if (result.status !== 'SUCCESS') return;
  const record = result.data.find((item) => item.ATT_ID === attendanceId);
  if (!record) {
    showToast('Attendance record could not be loaded.', 'error');
    return;
  }
  const options = ['Present', 'Absent', 'Half-Day', 'On Leave', 'Holiday'].map((status) =>
    `<option value="${status}" ${record.STATUS === status ? 'selected' : ''}>${status}</option>`
  ).join('');
  openModal('Edit Attendance', `
    <form id="attendanceEditForm" class="login-form" data-attendance-id="${attendanceId}">
      <p><strong>${escapeHtml(record.FULL_NAME)}</strong> — ${escapeHtml(record.ATT_DATE)}</p>
      <div class="form-group"><label>Status</label><select name="status">${options}</select></div>
      <div class="form-group"><label>Notes</label><input name="notes" value="${escapeHtml(record.NOTES)}" maxlength="200" /></div>
      <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
    </form>
  `);
}

async function deleteAttendance(attendanceId) {
  if (!confirm('Delete this attendance record?')) return;
  const result = await apiCall(`/attendance/${attendanceId}`, { method: 'DELETE' });
  if (result.status === 'SUCCESS') {
    showToast(result.message);
    loadPage('attendance');
  }
}

async function clockIn() {
  const empId = Number(prompt('Enter employee ID to clock in:', currentUser?.emp_id || '1001'));
  if (!empId) return;
  const result = await apiCall('/attendance/clock-in', { method: 'POST', body: JSON.stringify({ emp_id: empId }) });
  if (result.status === 'SUCCESS') {
    showToast(result.message || 'Clocked in successfully.');
    loadPage('attendance');
  }
}

async function clockOut() {
  const empId = Number(prompt('Enter employee ID to clock out:', currentUser?.emp_id || '1001'));
  if (!empId) return;
  const result = await apiCall('/attendance/clock-out', { method: 'POST', body: JSON.stringify({ emp_id: empId }) });
  if (result.status === 'SUCCESS') {
    showToast(result.message || 'Clocked out successfully.');
    loadPage('attendance');
  }
}

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.id === 'attendanceForm') {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    const result = await apiCall('/attendance', { method: 'POST', body: JSON.stringify(payload) });
    if (result.status === 'SUCCESS') {
      closeModal();
      showToast(result.message);
      loadPage('attendance');
    }
  } else if (form.id === 'attendanceEditForm') {
    event.preventDefault();
    const result = await apiCall(`/attendance/${form.dataset.attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    if (result.status === 'SUCCESS') {
      closeModal();
      showToast(result.message);
      loadPage('attendance');
    }
  }
});

async function loadPayroll() {
  const result = await apiCall('/payroll');
  if (result.status !== 'SUCCESS') return;
  const rows = result.data || [];
  const html = `
    <div class="card">
      <div class="section-header">
        <h3>Payroll</h3>
        <button class="btn btn-primary" onclick="openPayrollForm()">Generate Payroll</button>
      </div>
      <p class="help-text">Payroll prorates base salary and allowances by attendance. Half-days count as 0.5 day; approved-style On Leave entries count as a paid day. The latest performance rating may add a bonus.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Month</th><th>Days Credited</th><th>Performance</th><th>Bonus</th><th>Gross</th><th>Deduction</th><th>Net Pay</th><th>Status</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.FULL_NAME)}</td>
                <td>${escapeHtml(row.PAY_MONTH)}</td>
                <td>${row.DAYS_CREDITED ?? row.DAYS_PRESENT} / ${row.WORKING_DAYS}</td>
                <td>${row.PERFORMANCE_RATING ?? 'Not reviewed'}</td>
                <td>${formatCurrency(row.BONUS)}</td>
                <td>${formatCurrency(row.GROSS_SALARY)}</td>
                <td>${formatCurrency(row.TOTAL_DEDUCT)}</td>
                <td>${formatCurrency(row.NET_SALARY)}</td>
                <td><span class="badge ${badgeClass(row.STATUS)}">${escapeHtml(row.STATUS)}</span></td>
              </tr>
            `).join('') : `<tr><td colspan="9"><div class="empty-state">No payroll records found.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('contentArea').innerHTML = html;
}

async function openPayrollForm() {
  const result = await apiCall('/employees?status=Active');
  if (result.status !== 'SUCCESS') return;
  const employeeOptions = result.data.map((employee) =>
    `<option value="${employee.EMP_ID}">${employee.EMP_ID} - ${escapeHtml(employee.FULL_NAME)}</option>`
  ).join('');
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  openModal('Generate Payroll', `
    <form id="payrollForm" class="login-form">
      <div class="form-group"><label>Payroll Month</label><input name="month" type="month" value="${currentMonth}" required /></div>
      <div class="form-group"><label>Employees</label><select name="emp_id">
        <option value="">All active employees</option>${employeeOptions}
      </select></div>
      <p class="help-text">Attendance and the latest performance review are included in the calculation. A payroll record can only be generated once per employee per month.</p>
      <button type="submit" class="btn btn-primary btn-full">Generate Payroll</button>
    </form>
  `);
}

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.id !== 'payrollForm') return;
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  if (!payload.emp_id) delete payload.emp_id;
  const result = await apiCall('/payroll/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (result.status === 'SUCCESS') {
    closeModal();
    showToast(result.message);
    loadPage('payroll');
  }
});

async function loadPerformance() {
  const result = await apiCall('/performance');
  if (result.status !== 'SUCCESS') return;
  const rows = result.data || [];
  const html = `
    <div class="card">
      <div class="section-header">
        <h3>Performance Reviews</h3>
        <button class="btn btn-primary" onclick="openPerformanceForm()">Add Review</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Period</th><th>Reviewer</th><th>Rating</th><th>Recommendation</th><th>Actions</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.FULL_NAME)}</td>
                <td>${escapeHtml(row.REVIEW_PERIOD)}</td>
                <td>${escapeHtml(row.REVIEWER_NAME)}</td>
                <td>${row.RATING}/5</td>
                <td><span class="badge badge-info">${escapeHtml(row.RECOMMENDATION)}</span></td>
                <td><div class="toolbar-actions">
                  <button class="btn btn-primary" onclick="openPerformanceForm(${row.REVIEW_ID})">Edit</button>
                  <button class="btn btn-danger" onclick="deletePerformanceReview(${row.REVIEW_ID})">Delete</button>
                </div></td>
              </tr>
            `).join('') : `<tr><td colspan="6"><div class="empty-state">No reviews yet.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('contentArea').innerHTML = html;
}

async function openPerformanceForm(reviewId = null) {
  const [employeesResult, reviewsResult] = await Promise.all([apiCall('/employees'), apiCall('/performance')]);
  if (employeesResult.status !== 'SUCCESS' || reviewsResult.status !== 'SUCCESS') return;
  const review = reviewId ? reviewsResult.data.find((item) => item.REVIEW_ID === reviewId) : null;
  if (reviewId && !review) {
    showToast('Performance review could not be loaded.', 'error');
    return;
  }
  const employeeOptions = employeesResult.data.map((employee) =>
    `<option value="${employee.EMP_ID}" ${review?.EMP_ID === employee.EMP_ID ? 'selected' : ''}>${employee.EMP_ID} - ${escapeHtml(employee.FULL_NAME)}</option>`
  ).join('');
  const reviewerOptions = employeesResult.data.map((employee) =>
    `<option value="${employee.EMP_ID}" ${(review?.REVIEWER_ID || currentUser?.emp_id) === employee.EMP_ID ? 'selected' : ''}>${employee.EMP_ID} - ${escapeHtml(employee.FULL_NAME)}</option>`
  ).join('');
  const value = (field, defaultValue = '') => escapeHtml(review?.[field] ?? defaultValue);
  const recommendationOptions = ['None', 'Promote', 'Bonus', 'Training', 'PIP'].map((recommendation) =>
    `<option value="${recommendation}" ${review?.RECOMMENDATION === recommendation ? 'selected' : ''}>${recommendation}</option>`
  ).join('');
  openModal(review ? 'Edit Performance Review' : 'Add Performance Review', `
    <form id="performanceForm" class="login-form" data-review-id="${review?.REVIEW_ID || ''}">
      <div class="grid-2">
        <div class="form-group"><label>Employee</label><select name="emp_id" required>${employeeOptions}</select></div>
        <div class="form-group"><label>Review Period</label><input name="review_period" value="${value('REVIEW_PERIOD', '2026-H2')}" required /></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Reviewer</label><select name="reviewer_id" required>${reviewerOptions}</select></div>
        <div class="form-group"><label>Overall Rating (1–5)</label><input name="rating" type="number" min="1" max="5" step="0.1" value="${value('RATING')}" required /></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Communication</label><input name="communication" type="number" min="1" max="5" step="0.1" value="${value('COMMUNICATION')}" required /></div>
        <div class="form-group"><label>Technical</label><input name="technical" type="number" min="1" max="5" step="0.1" value="${value('TECHNICAL')}" required /></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Teamwork</label><input name="teamwork" type="number" min="1" max="5" step="0.1" value="${value('TEAMWORK')}" required /></div>
        <div class="form-group"><label>Punctuality</label><input name="punctuality" type="number" min="1" max="5" step="0.1" value="${value('PUNCTUALITY')}" required /></div>
      </div>
      <div class="form-group"><label>Recommendation</label><select name="recommendation">${recommendationOptions}</select></div>
      <div class="form-group"><label>Strengths</label><input name="strengths" value="${value('STRENGTHS')}" /></div>
      <div class="form-group"><label>Areas to Improve</label><input name="improvements" value="${value('IMPROVEMENTS')}" /></div>
      <div class="form-group"><label>Goals</label><input name="goals" value="${value('GOALS')}" /></div>
      <button type="submit" class="btn btn-primary btn-full">${review ? 'Save Review' : 'Submit Review'}</button>
    </form>
  `);
}

async function deletePerformanceReview(reviewId) {
  if (!confirm('Delete this performance review?')) return;
  const result = await apiCall(`/performance/${reviewId}`, { method: 'DELETE' });
  if (result.status === 'SUCCESS') {
    showToast(result.message);
    loadPage('performance');
  }
}

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (form.id !== 'performanceForm') return;
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  const reviewId = form.dataset.reviewId;
  const result = await apiCall(reviewId ? `/performance/${reviewId}` : '/performance/add', {
    method: reviewId ? 'PUT' : 'POST',
    body: JSON.stringify(payload)
  });
  if (result.status === 'SUCCESS') {
    closeModal();
    showToast(result.message);
    loadPage('performance');
  }
});

async function loadAudit() {
  const html = `
    <div class="card">
      <div class="section-header">
        <h3>Audit Log</h3>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Table</th><th>Action</th><th>Old Values</th><th>New Values</th></tr></thead>
          <tbody>
            <tr><td colspan="4"><div class="empty-state">Audit records are available in the Oracle database layer and can be surfaced here when connected.</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('contentArea').innerHTML = html;
}
