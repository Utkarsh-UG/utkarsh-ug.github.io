const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("site-nav");

const storedTheme = localStorage.getItem("portfolio-theme");
if (storedTheme === "dark") {
  root.dataset.theme = "dark";
  themeToggle.textContent = "☼";
  themeToggle.setAttribute("aria-label", "Switch to light mode");
}

themeToggle.addEventListener("click", () => {
  const isDark = root.dataset.theme === "dark";
  if (isDark) {
    delete root.dataset.theme;
    localStorage.setItem("portfolio-theme", "light");
    themeToggle.textContent = "☾";
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
  } else {
    root.dataset.theme = "dark";
    localStorage.setItem("portfolio-theme", "dark");
    themeToggle.textContent = "☼";
    themeToggle.setAttribute("aria-label", "Switch to light mode");
  }
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const renderActivity = (grid, submissionCalendar, prefix, noun, year) => {
  if (grid) {
    const today = new Date();
    const end = year ? new Date(year, 11, 31, 12) : new Date(today.setHours(12, 0, 0, 0));
    const start = year ? new Date(year, 0, 1, 12) : new Date(end);
    if (!year) start.setDate(start.getDate() - 363);
    const firstSunday = new Date(start);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

    let total = 0;
    let activeDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    const months = new Map();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    grid.replaceChildren();
    for (let date = new Date(firstSunday); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
      ].join("-");
      const count = Number(submissionCalendar[dateKey] || 0);
      total += count;
      activeDays += count > 0 ? 1 : 0;
      if (count > 0) {
        currentStreak += 1;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      if (date.getDate() <= 7 && (!year || date.getFullYear() === year)) {
        const week = Math.floor((date - firstSunday) / (7 * millisecondsPerDay)) + 1;
        months.set(date.getMonth(), {
          label: date.toLocaleString("en", { month: "short" }),
          week
        });
      }
      const cell = document.createElement("i");
      const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
      cell.className = "activity-cell";
      cell.dataset.level = String(level);
      cell.title = `${count} ${noun}${count === 1 ? "" : "s"} on ${date.toLocaleDateString()}`;
      cell.setAttribute("aria-hidden", "true");
      grid.appendChild(cell);
    }

    const totalElement = document.getElementById(`${prefix}-total`);
    const activeDaysElement = document.getElementById(`${prefix}-active-days`);
    const maxStreakElement = document.getElementById(`${prefix}-max-streak`);
    if (totalElement) totalElement.firstChild.textContent = `${total} `;
    if (activeDaysElement) activeDaysElement.textContent = String(activeDays);
    if (maxStreakElement) maxStreakElement.textContent = String(maxStreak);

    const monthLabels = grid.closest(".leetcode-activity").querySelector(".activity-months");
    if (monthLabels) {
      monthLabels.replaceChildren();
      const weekCount = Math.floor((end - firstSunday) / (7 * millisecondsPerDay)) + 1;
      monthLabels.style.gridTemplateColumns = `repeat(${weekCount}, minmax(0, 1fr))`;
      months.forEach(({ label, week }) => {
        const month = document.createElement("span");
        month.textContent = label;
        month.style.gridColumn = String(week);
        monthLabels.appendChild(month);
      });
    }
  }
};

const loadActivity = (gridId, file, prefix, noun) => {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  fetch(`data/${file}`, { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`${prefix} activity request failed: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (prefix !== "github") {
        renderActivity(grid, data.submissionCalendar || {}, prefix, noun);
        return;
      }
      const currentYear = new Date().getFullYear();
      const calendars = data.calendars || { [currentYear]: data.submissionCalendar || {} };
      const yearSelect = document.getElementById("github-year");
      const renderYear = (year) => {
        const calendar = calendars[year] || {};
        renderActivity(grid, calendar, prefix, noun, Number(year));
        if (yearSelect) yearSelect.value = year;
      };
      if (yearSelect) {
        yearSelect.replaceChildren();
        Object.keys(calendars).sort((a, b) => b - a).forEach((year) => {
          const option = document.createElement("option");
          option.value = year;
          option.textContent = year;
          yearSelect.appendChild(option);
        });
        yearSelect.addEventListener("change", () => renderYear(yearSelect.value));
      }
      const defaultYear = Object.keys(calendars).sort().pop() || String(currentYear);
      renderYear(defaultYear);
    })
    .catch((error) => {
      console.error(`Unable to load ${prefix} activity.`, error);
      renderActivity(grid, {}, prefix, noun);
    });
};

loadActivity("leetcode-grid", "leetcode.json", "leetcode", "submission");
loadActivity("github-grid", "github.json", "github", "contribution");
