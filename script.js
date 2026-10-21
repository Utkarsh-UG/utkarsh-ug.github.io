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

const leetcodeGrid = document.getElementById("leetcode-grid");
if (leetcodeGrid) {
  const renderLeetCodeActivity = (submissionCalendar) => {
    const today = new Date();
    const end = new Date(today);
    end.setHours(12, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 363);
    const firstSunday = new Date(start);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

    leetcodeGrid.replaceChildren();
    for (let date = new Date(firstSunday); date <= end; date.setDate(date.getDate() + 1)) {
      const timestamp = Math.floor(date.getTime() / 1000);
      const count = Number(submissionCalendar[String(timestamp)] || 0);
      const cell = document.createElement("i");
      const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
      cell.className = "activity-cell";
      cell.dataset.level = String(level);
      cell.title = `${count} submission${count === 1 ? "" : "s"} on ${date.toLocaleDateString()}`;
      cell.setAttribute("aria-hidden", "true");
      leetcodeGrid.appendChild(cell);
    }
  };

  fetch("data/leetcode.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`LeetCode activity request failed: ${response.status}`);
      return response.json();
    })
    .then((data) => renderLeetCodeActivity(data.submissionCalendar || {}))
    .catch((error) => {
      console.error("Unable to load LeetCode activity.", error);
      renderLeetCodeActivity({});
    });
}
