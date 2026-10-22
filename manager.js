/* DIABLOOON Manager — free local decision-support prototype.
   No external model/API, no paid calls, no uploads, no publishing. */
(function () {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const checks = [
    ["original", "Original story idea"],
    ["kindness", "Kindness / teamwork lesson"],
    ["safe", "Child-safe, age-appropriate scenes"],
    ["characters", "Keep the five recurring character designs consistent"],
    ["audio", "Review voice and music"],
    ["thumbnail", "Prepare and review thumbnail"],
    ["owner", "Owner approval received"]
  ];

  function scoreBrief(idea, duration) {
    const text = String(idea || "").trim();
    const words = text.split(/\s+/).filter(Boolean);
    const warnings = [];
    if (words.length < 3) warnings.push("Add more detail to the idea before planning scenes.");
    if (/scary|blood|weapon|kill|hurt|dangerous/i.test(text)) warnings.push("Review wording carefully for a 4–8 audience.");
    if (!/friend|team|kind|help|share|adventure|mystery|treasure|animal|jungle/i.test(text)) warnings.push("Consider adding a clear animal-adventure hook.");
    return { words: words.length, duration: Number(duration) || 1, warnings };
  }

  function render() {
    const idea = byId("idea")?.value || "";
    const duration = byId("duration")?.value || "6";
    const brief = scoreBrief(idea, duration);
    const box = byId("managerReport");
    if (!box) return;
    const warningHtml = brief.warnings.length
      ? brief.warnings.map((w) => "<li>" + escapeHtml(w) + "</li>").join("")
      : "<li>Basic checklist passed. Human review is still required.</li>";
    box.innerHTML =
      "<p><strong>Manager mode:</strong> Local rules only — no cloud AI connected.</p>" +
      "<p><strong>Plan:</strong> " + escapeHtml(brief.duration + "-minute " + (brief.duration <= 3 ? "Short-friendly" : "episode") + " concept") + "</p>" +
      "<p><strong>Idea:</strong> " + escapeHtml(idea || "Add an idea above") + "</p>" +
      "<p><strong>Review notes:</strong></p><ul>" + warningHtml + "</ul>" +
      "<p><strong>Publishing:</strong> LOCKED — owner approval required. This manager cannot publish.</p>";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function makeChecklist() {
    const host = byId("managerChecklist");
    if (!host) return;
    host.innerHTML = checks.map(([key, label]) =>
      '<label style="display:block;margin:8px 0"><input type="checkbox" data-manager-check="' + key + '"> ' +
      escapeHtml(label) + '</label>'
    ).join("");
    host.addEventListener("change", (event) => {
      const input = event.target;
      if (!input.matches("[data-manager-check]")) return;
      if (input.dataset.managerCheck === "owner" && input.checked) {
        input.checked = false;
        alert("Approval must be given explicitly by the channel owner for a specific finished video. This checklist cannot grant publishing permission.");
      }
      updateChecklistStatus();
    });
    updateChecklistStatus();
  }

  function updateChecklistStatus() {
    const boxes = Array.from(document.querySelectorAll("[data-manager-check]"));
    const ownerApproved = false;
    const complete = boxes.filter((box) => box.checked && box.dataset.managerCheck !== "owner").length;
    const status = byId("managerChecklistStatus");
    if (status) status.textContent = complete + " of " + (checks.length - 1) + " preparation checks complete. Owner approval: " + (ownerApproved ? "granted" : "NOT GIVEN");
  }

  document.addEventListener("DOMContentLoaded", () => {
    makeChecklist();
    byId("managerRun")?.addEventListener("click", render);
    byId("idea")?.addEventListener("input", render);
    byId("duration")?.addEventListener("change", render);
    render();
  });
})();
