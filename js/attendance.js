import { supabase } from "./supabase.js";

const dateInput = document.getElementById("dateInput");
const deptSelect = document.getElementById("dept_filter");
const periodSelect = document.getElementById("period_select");
const tableBody = document.getElementById("attendanceTableBody");
const saveBtn = document.getElementById("saveAttendanceBtn");
const thOT = document.getElementById("th_ot");

if (dateInput) dateInput.valueAsDate = new Date();

const loadEmployees = async () => {
  const dept = deptSelect.value;
  const period = periodSelect.value;

  if (thOT) thOT.style.display = (period === "afternoon") ? "table-cell" : "none";
  tableBody.innerHTML = "";

  if (!dept) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="padding: 60px; color: #999; text-align:center;">
          <div style="font-size: 40px; margin-bottom: 15px;">🏢</div>
          กรุณาเลือก <b>"แผนก"</b> เพื่อแสดงรายชื่อ
        </td>
      </tr>`;
    return;
  }

  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .eq("department", dept)
    .order("employee_code", { ascending: true });

  if (error || !employees?.length) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px;">ไม่พบพนักงาน</td></tr>`;
    return;
  }

  employees.forEach(emp => {
    const row = document.createElement("tr");
    const radioName = `status_${emp.id}`;
    const otCell = (period === "afternoon")
      ? `<td><input type="checkbox" class="ot-check"></td>`
      : `<td style="display:none;"></td>`;

    row.innerHTML = `
      <td>${emp.department}</td>
      <td>${emp.employee_code}</td>
      <td style="text-align:left;">${emp.full_name}</td>
      <td><input type="radio" name="${radioName}" value="มา"></td>
      <td><input type="radio" name="${radioName}" value="ลาป่วย"></td>
      <td><input type="radio" name="${radioName}" value="ลากิจ"></td>
      <td><input type="radio" name="${radioName}" value="ขาด"></td>
      ${otCell}
    `;

    row.dataset.empId = emp.id;
    row.dataset.empName = emp.full_name;
    row.dataset.dept = emp.department;

    tableBody.appendChild(row);
  });
};

if (deptSelect) deptSelect.addEventListener("change", loadEmployees);
if (periodSelect) periodSelect.addEventListener("change", loadEmployees);

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const date = dateInput.value;
    const dept = deptSelect.value;
    const period = periodSelect.value;

    if (!date || !dept) {
      return Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาเลือกวันที่และแผนก"
      });
    }

    // 🔒 กันลืมเลือกสถานะ
    let isValid = true;
    tableBody.querySelectorAll("tr").forEach(row => {
      if (!row.dataset.empId) return;
      const checked = row.querySelector(`input[type="radio"]:checked`);
      if (!checked) isValid = false;
    });

    if (!isValid) {
      return Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาเลือกสถานะให้ครบทุกคน"
      });
    }

    // ❓ ยืนยันก่อนบันทึก
    const confirm = await Swal.fire({
      icon: "question",
      title: "ยืนยันการบันทึก?",
      text: "คุณต้องการบันทึกข้อมูลการเช็คชื่อใช่หรือไม่",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก"
    });
    if (!confirm.isConfirmed) return;

    // 🚫 กันบันทึกซ้ำ
    const { data: existing = [] } = await supabase
      .from("attendance")
      .select("id")
      .eq("date", date)
      .eq("department", dept)
      .eq("time_period", period);

    if (existing.length > 0) {
      return Swal.fire("บันทึกซ้ำไม่ได้", `แผนก ${dept} ช่วง ${period} ถูกบันทึกแล้ว`, "error");
    }

    // 📦 เตรียมข้อมูลบันทึก
    const records = [];
    tableBody.querySelectorAll("tr").forEach(row => {
      if (!row.dataset.empId) return;

      records.push({
        employee_id: row.dataset.empId,
        employee_name: row.dataset.empName,
        department: row.dataset.dept,
        date: date,
        thai_date: new Date(date).toLocaleDateString("th-TH"),
        time_period: period,
        status: row.querySelector(`input[type="radio"]:checked`)?.value || "ขาด",
        ot: row.querySelector(".ot-check")?.checked || false
      });
    });

    const { error } = await supabase.from("attendance").insert(records);

    if (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    } else {
      Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
      loadEmployees(); // รีเฟรชตารางหลังบันทึก
    }
  });
}
