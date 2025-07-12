document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("expense-form");
  const tableBody = document.querySelector("#expense-table tbody");
  const currencySymbol = document.getElementById("currency");
  const fromDate = document.getElementById("filter-from");
  const toDate = document.getElementById("filter-to");
  const minAmount = document.getElementById("filter-min-amount");
  const categorySelect = document.getElementById("filter-category");
  const themeSelect = document.getElementById("theme-select");
  const toggleSwitch = document.getElementById("dark-mode-toggle");

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  let currentCurrency = "₹";

  const exchangeRates = {
    INR: { USD: 0.012, EUR: 0.011, GBP: 0.0098, JPY: 1.68, INR: 1 },
    USD: { INR: 83.5, EUR: 0.93, GBP: 0.82, JPY: 140, USD: 1 },
    EUR: { INR: 90, USD: 1.07, GBP: 0.88, JPY: 150, EUR: 1 },
    GBP: { INR: 104, USD: 1.2, EUR: 1.13, JPY: 160, GBP: 1 },
    JPY: { INR: 0.59, USD: 0.0071, EUR: 0.0067, GBP: 0.0063, JPY: 1 },
  };

  // 🌙 Theme setup with dropdown + toggle
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  themeSelect.value = savedTheme;
  toggleSwitch.checked = (savedTheme === "dark");

  themeSelect.addEventListener("change", () => {
    const selected = themeSelect.value;
    document.body.setAttribute("data-theme", selected);
    localStorage.setItem("theme", selected);
    toggleSwitch.checked = (selected === "dark");
  });

  toggleSwitch.addEventListener("change", () => {
    const isDark = toggleSwitch.checked;
    const theme = isDark ? "dark" : "light";
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeSelect.value = theme;
  });

  function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }

  function getUniqueCategories() {
    return [...new Set(expenses.map(e => e.category))];
  }

  function updateCategoryFilter() {
    categorySelect.innerHTML = `<option value="">All Categories</option>`;
    getUniqueCategories().forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  function applyFilters() {
    const category = categorySelect.value;
    const from = fromDate.value;
    const to = toDate.value;
    const min = parseFloat(minAmount.value) || 0;

    return expenses
      .map((exp, index) => ({ ...exp, index })) // attach original index for deletion
      .filter(exp => {
        const dateOk = (!from || exp.date >= from) && (!to || exp.date <= to);
        const catOk = !category || exp.category === category;
        const amtOk = parseFloat(exp.amount) >= min;
        return dateOk && catOk && amtOk;
      });
  }

  function calculateStats(filtered) {
    const total = filtered.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const dates = filtered.map(exp => new Date(exp.date)).sort((a, b) => a - b);
    const days = (dates.length > 1)
      ? Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 3600 * 24)) + 1
      : 1;

    const avgDay = (total / days).toFixed(2);
    const avgWeek = (total / (days / 7)).toFixed(2);
    const avgMonth = (total / (days / 30)).toFixed(2);

    document.getElementById("total-spending").textContent = currentCurrency + total.toFixed(2);
    document.getElementById("avg-day").textContent = currentCurrency + (isFinite(avgDay) ? avgDay : 0);
    document.getElementById("avg-week").textContent = currentCurrency + (isFinite(avgWeek) ? avgWeek : 0);
    document.getElementById("avg-month").textContent = currentCurrency + (isFinite(avgMonth) ? avgMonth : 0);
  }

  function renderExpenses() {
    const filtered = applyFilters();
    tableBody.innerHTML = "";
    filtered.forEach((exp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${exp.date}</td>
        <td>${currentCurrency}${exp.amount}</td>
        <td>${exp.category}</td>
        <td>${exp.description}</td>
        <td><button onclick="deleteExpense(${exp.index})">X</button></td>
      `;
      tableBody.appendChild(row);
    });
    calculateStats(filtered);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const expense = {
      amount: document.getElementById("amount").value,
      category: document.getElementById("category").value,
      description: document.getElementById("description").value,
      date: document.getElementById("date").value,
    };
    expenses.push(expense);
    saveExpenses();
    updateCategoryFilter();
    renderExpenses();
    form.reset();
  });

  window.deleteExpense = function (originalIndex) {
    expenses.splice(originalIndex, 1);
    saveExpenses();
    updateCategoryFilter();
    renderExpenses();
  };

  document.getElementById("apply-filters").addEventListener("click", renderExpenses);

  currencySymbol.addEventListener("change", (e) => {
    currentCurrency = e.target.value;
    renderExpenses();
  });

  document.getElementById("convert-btn").addEventListener("click", () => {
    const amt = parseFloat(document.getElementById("convert-amount").value);
    const from = document.getElementById("from-currency").value;
    const to = document.getElementById("to-currency").value;

    if (isNaN(amt)) {
      document.getElementById("conversion-result").textContent = `Please enter a valid amount`;
      return;
    }

    const converted = amt * exchangeRates[from][to];
    document.getElementById("conversion-result").textContent = `Converted amount: ${converted.toFixed(2)} ${to}`;
    document.getElementById("from-label").textContent = from;
    document.getElementById("to-label").textContent = to;
  });

  updateCategoryFilter();
  renderExpenses();
});
