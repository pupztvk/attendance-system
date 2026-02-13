import { supabase } from "./supabase.js";

// ================= TAB =================
window.switchTab = (tabName) => {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-${tabName}`)?.classList.add('active');

  const btns = document.querySelectorAll('.tab-btn');
  if (tabName === 'add') btns[0]?.classList.add('active');
  if (tabName === 'transfer') btns[1]?.classList.add('active');
  if (tabName === 'remove') btns[2]?.classList.add('active');
};

// ================= ADD =================
const saveBtn = document.getElementById("saveNewEmployeeBtn");

saveBtn?.addEventListener("click", async () => {
  const prefix = document.getElementById("add_prefix")?.value || "";
  const code = document.getElementById("add_emp_code")?.value.trim();
  const fname = document.getElementById("add_first_name")?.value.trim();
  const lname = document.getElementById("add_last_name")?.value.trim();
  const dept = document.getElementById("dept_add")?.value;

  if (!code || !fname || !lname || !dept) {
    return Swal.fire("ข้อมูลไม่ครบ", "กรอกให้ครบทุกช่อง", "warning");
  }

  const { data: exist, error: err1 } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_code", code);

  if (err1) return Swal.fire("Error", err1.message, "error");
  if (exist.length > 0) return Swal.fire("รหัสซ้ำ", "รหัสนี้มีแล้ว", "error");

  const { error } = await supabase.from("employees").insert([{
    employee_code: code,
    full_name: `${prefix} ${fname} ${lname}`,
    department: dept
  }]);

  if (error) {
    Swal.fire("Error", error.message, "error");
  } else {
    Swal.fire("สำเร็จ", "เพิ่มพนักงานเรียบร้อย", "success");
    document.getElementById("add_emp_code").value = "";
    document.getElementById("add_first_name").value = "";
    document.getElementById("add_last_name").value = "";
  }
});

// ================= TRANSFER =================
const searchTransBtn = document.getElementById("searchTransBtn");
const confirmTransBtn = document.getElementById("confirmTransBtn");
const transArea = document.getElementById("trans_form_area");
let transEmpCode = null;

searchTransBtn?.addEventListener("click", async () => {
  const code = document.getElementById("trans_search_code")?.value.trim();
  if (!code) return;

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("employee_code", code)
    .single();

  if (error || !data) {
    transArea?.classList.remove("active");
    return Swal.fire("ไม่พบข้อมูล", "", "error");
  }

  transEmpCode = data.employee_code;
  document.getElementById("trans_name").value = data.full_name;
  document.getElementById("trans_current_dept").value = data.department;
  transArea?.classList.add("active");
});

confirmTransBtn?.addEventListener("click", async () => {
  const newDept = document.getElementById("trans_new_dept")?.value;
  if (!newDept) return Swal.fire("แจ้งเตือน", "เลือกแผนกใหม่", "warning");

  const { error } = await supabase
    .from("employees")
    .update({ department: newDept })
    .eq("employee_code", transEmpCode);

  if (error) Swal.fire("Error", error.message, "error");
  else {
    Swal.fire("สำเร็จ", "ย้ายแผนกแล้ว", "success");
    transArea?.classList.remove("active");
  }
});

// ================= REMOVE =================
const searchDelBtn = document.getElementById("searchDelBtn");
const confirmDelBtn = document.getElementById("confirmDelBtn");
const delArea = document.getElementById("del_form_area");
let delEmpCode = null;

searchDelBtn?.addEventListener("click", async () => {
  const code = document.getElementById("del_search_code")?.value.trim();
  if (!code) return;

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("employee_code", code)
    .single();

  if (error || !data) {
    delArea?.classList.remove("active");
    return Swal.fire("ไม่พบข้อมูล", "", "error");
  }

  delEmpCode = data.employee_code;
  document.getElementById("del_first_name").value = data.full_name;
  document.getElementById("del_dept").value = data.department;
  delArea?.classList.add("active");
  confirmDelBtn.disabled = false;
});

confirmDelBtn?.addEventListener("click", async () => {
  const res = await Swal.fire({
    title: "ยืนยันลบ?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "ลบ"
  });

  if (res.isConfirmed) {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("employee_code", delEmpCode);

    if (error) Swal.fire("Error", error.message, "error");
    else {
      Swal.fire("สำเร็จ", "ลบแล้ว", "success");
      delArea?.classList.remove("active");
    }
  }
});
