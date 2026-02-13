console.log("✅ dashboard_logic.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  // ====== SPA Navigation (เมนูด้านบน) ======
  const navAttendance = document.getElementById("navAttendance");
  const navHistory = document.getElementById("navHistory");
  const navEmployee = document.getElementById("navEmployee");
  const logoutBtn = document.getElementById("logoutBtn");

  const sectionAttendance = document.getElementById("section-attendance");
  const sectionHistory = document.getElementById("section-history");
  const sectionEmployee = document.getElementById("section-employee");

  const navBtns = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".content-section");

  function showSection(sectionId, btn) {
    sections.forEach(sec => sec.classList.remove("active"));
    navBtns.forEach(b => b.classList.remove("active"));

    document.getElementById(sectionId).classList.add("active");
    btn.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navAttendance?.addEventListener("click", () => {
    showSection("section-attendance", navAttendance);
  });

  navHistory?.addEventListener("click", () => {
    showSection("section-history", navHistory);
  });

  navEmployee?.addEventListener("click", () => {
    showSection("section-employee", navEmployee);
  });

  logoutBtn?.addEventListener("click", () => {
    Swal.fire({
      icon: "question",
      title: "ออกจากระบบ?",
      text: "คุณต้องการออกจากระบบใช่หรือไม่",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก"
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "index.html";
      }
    });
  });
});
