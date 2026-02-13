import { supabase } from "./supabase.js";

const searchBtn = document.getElementById("searchHistoryBtn");
const dateInput = document.getElementById("hist_date");
const periodSelect = document.getElementById("hist_period");
const deptSelect = document.getElementById("hist_dept");
const tableBody = document.getElementById("historyTableBody");
const statsContainer = document.getElementById("statsContainer");
const exportBtn = document.getElementById("exportExcelPopupBtn");
const printBtn = document.getElementById("printPdfBtn");

let donutChart = null;
let barChart = null;

if (dateInput) dateInput.valueAsDate = new Date();

const formatDateThai = (d) =>
  new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });

const loadHistory = async (deptFilter = "") => {
  const date = dateInput.value;
  const period = periodSelect.value;

  if (!date) return Swal.fire("เตือน", "กรุณาเลือกวันที่", "warning");

  tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">กำลังโหลด...</td></tr>`;
  statsContainer.style.display = "none";

  let query = supabase
    .from("attendance")
    .select("*, employees(employee_code)")
    .eq("date", date)
    .order("department");

  // ✅ ถ้าไม่ใช่ "ทุกช่วงเวลา" ค่อยกรองช่วงเวลา
  if (period !== "all") {
    query = query.eq("time_period", period);
  }

  // ✅ กรองแผนก (ถ้ามีเลือก)
  if (deptFilter) {
    query = query.eq("department", deptFilter);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">ไม่พบข้อมูล</td></tr>`;
    return;
  }

  tableBody.innerHTML = "";

  let stats = { มา: 0, ลาป่วย: 0, ลากิจ: 0, ขาด: 0, ot: 0 };

  data.forEach((row) => {
    stats[row.status] = (stats[row.status] || 0) + 1;
    if (row.ot) stats.ot++;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.department}</td>
      <td>${row.employees?.employee_code || "-"}</td>
      <td style="text-align:left;">${row.employee_name}</td>
      <td>${row.status}</td>
      <td>${row.ot ? "✓" : "-"}</td>
    `;
    tableBody.appendChild(tr);
  });

  renderCharts(stats);
};

const renderCharts = (stats) => {
  statsContainer.style.display = "block";

  const come = stats["มา"] || 0;
  const sick = stats["ลาป่วย"] || 0;
  const leave = stats["ลากิจ"] || 0;
  const absent = stats["ขาด"] || 0;
  const ot = stats.ot || 0;
  const total = come + sick + leave + absent;

  document.getElementById("statCome").innerText = come;
  document.getElementById("statSick").innerText = sick;
  document.getElementById("statLeave").innerText = leave;
  document.getElementById("statAbsent").innerText = absent;
  document.getElementById("statOT").innerText = ot;
  document.getElementById("statTotal").innerText = total;

  const labels = ["มา", "ลาป่วย", "ลากิจ", "ขาด"];
  const values = [come, sick, leave, absent];

  // Donut
  const ctx1 = document.getElementById("attendanceDonut").getContext("2d");
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(ctx1, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ["#22c55e", "#facc15", "#06b6d4", "#ef4444"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "right" } } }
  });

  // Bar
  const ctx2 = document.getElementById("attendanceBar").getContext("2d");
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "จำนวนคน",
        data: values,
        backgroundColor: ["#22c55e", "#facc15", "#06b6d4", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
};

if (searchBtn) searchBtn.addEventListener("click", () => loadHistory(deptSelect.value));

// Excel
if (exportBtn) exportBtn.addEventListener("click", async () => {
  const { data } = await supabase.from("attendance").select("*, employees(employee_code)");
  if (!data?.length) return Swal.fire("ไม่พบข้อมูล", "", "info");

  const excelData = data.map((i) => ({
    วันที่: formatDateThai(i.date),
    ช่วง: i.time_period,
    แผนก: i.department,
    รหัส: i.employees?.employee_code,
    ชื่อ: i.employee_name,
    สถานะ: i.status,
    OT: i.ot ? "✓" : "-"
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, "Report.xlsx");
});

// PDF
if (printBtn) {
  printBtn.addEventListener("click", async () => {
    const el = document.getElementById("section-history");
    const opt = { margin: 0.5, filename: "attendance-report.pdf", html2canvas: { scale: 2 } };
    await html2pdf().set(opt).from(el).save();
  });
}
