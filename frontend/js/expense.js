const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const base_url = "http://localhost:5000";

if (!token) {
  alert("Please login first!");
  window.location.href = "./index.html";
} else {
  document.body.style.display = "block";
}

// Axios default header
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// ===== Theme Toggle =====
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const html = document.documentElement;

if (localStorage.getItem("theme") === "dark") {
  html.classList.add("dark");
  setMoon();
}

themeToggle.addEventListener("click", () => {
  html.classList.toggle("dark");
  const isDark = html.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  isDark ? setMoon() : setSun();
});

function setSun() {
  themeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h1M3 12H2m15.364 6.364l.707.707M6.343 6.343l-.707-.707m12.728 0l.707-.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        `;
}
function setMoon() {
  themeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        `;
}
// ===== Premium Status =====
let isPremium = localStorage.getItem("isPremium") === "true";

// DOM elements
const premiumBtn = document.getElementById("premium-btn");
const downloadBtn = document.getElementById("downloadBtn");
const toggleDashboardBtn = document.getElementById("toggleDashboardBtn");
const fullDashboard = document.getElementById("full-dashboard");
const leaderboardBtn = document.getElementById("leaderboard-btn");
const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardList = document.getElementById("leaderboard-list");
const addExpenseAI = document.getElementById("addExpenseAI");

// ===== Enable / disable buttons based on premium =====
function updatePremiumUI() {
  if (isPremium) {
    downloadBtn.disabled = false;
    toggleDashboardBtn.disabled = false;
    downloadBtn.classList.remove("cursor-not-allowed", "bg-indigo-400/70");
    toggleDashboardBtn.classList.remove(
      "cursor-not-allowed",
      "bg-indigo-400/70"
    );
    addExpenseAI.classList.remove("hidden");
    downloadBtn.classList.add("bg-indigo-500", "hover:bg-indigo-600");
    toggleDashboardBtn.classList.add("bg-indigo-500", "hover:bg-indigo-600");

    premiumBtn.textContent = "🌟 Premium User";
    premiumBtn.disabled = true;
    premiumBtn.classList.add("bg-gray-400", "cursor-not-allowed");

    leaderboardBtn.classList.remove("hidden");
  } else {
    downloadBtn.disabled = true;
    toggleDashboardBtn.disabled = true;
    downloadBtn.classList.add("cursor-not-allowed", "bg-indigo-400/70");
    toggleDashboardBtn.classList.add("cursor-not-allowed", "bg-indigo-400/70");
    addExpenseAI.classList.add("hidden");
    premiumBtn.disabled = false;
    premiumBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
    leaderboardBtn.classList.add("hidden");
  }
}
updatePremiumUI();

// ===== Transactions =====
let transactions = [];
let currentPage = 1;
let rowsPerPage = parseInt(localStorage.getItem("pageSize")) || 5;

// Dashboard Pagination
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const pageSizeSelect = document.getElementById("pageSize");
pageSizeSelect.value = rowsPerPage;

pageSizeSelect.addEventListener("change", (e) => {
  rowsPerPage = parseInt(e.target.value);
  localStorage.setItem("pageSize", rowsPerPage);
  currentPage = 1;
  renderTransactionsPage();
});

function renderTransactionsPage() {
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = transactions.slice(start, end);

  const transactionBody = document.getElementById("transactionBody");
  transactionBody.innerHTML = "";

  let expenseTotal = 0;
  transactions.forEach((t) => {
    if (t.type === "Expense") expenseTotal += t.amount;
  });

  paginatedData.forEach((t) => {
    const row = document.createElement("tr");
    row.className = "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm";
    row.innerHTML = `
      <td class="py-1 px-2">${t.date}</td>
      <td class="py-1 px-2">${t.desc}</td>
      <td class="py-1 px-2">${t.category}</td>
      <td class="py-1 px-2">${t.type}</td>
      <td class="py-1 px-2">₹${t.amount}</td>
    `;
    transactionBody.appendChild(row);
  });

  document.getElementById("totalExpense").textContent = `₹${expenseTotal}`;

  const totalPages = Math.ceil(transactions.length / rowsPerPage) || 1;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled =
    currentPage === totalPages || transactions.length === 0;
}

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTransactionsPage();
  }
});
nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTransactionsPage();
  }
});

// ===== Expense List Pagination =====
let expenseListCurrentPage = 1;
let expenseListRowsPerPage = 2;

const expenseListContainer = document.getElementById("expense-list");

// Page size selector
const expenseListPageSizeContainer = document.createElement("div");
expenseListPageSizeContainer.className =
  "flex justify-end items-center mt-2 gap-2 text-gray-700 dark:text-gray-200";

const pageSizeLabel = document.createElement("label");
pageSizeLabel.textContent = "Expenses per page:";
pageSizeLabel.htmlFor = "expenseListPageSize";

const expenseListPageSizeSelect = document.createElement("select");
expenseListPageSizeSelect.id = "expenseListPageSize";
expenseListPageSizeSelect.className =
  "px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-indigo-300 dark:bg-gray-700 dark:text-white";
[2, 5, 10, 20].forEach((size) => {
  const option = document.createElement("option");
  option.value = size;
  option.textContent = size;
  if (size === expenseListRowsPerPage) option.selected = true;
  expenseListPageSizeSelect.appendChild(option);
});

expenseListPageSizeContainer.appendChild(pageSizeLabel);
expenseListPageSizeContainer.appendChild(expenseListPageSizeSelect);
expenseListContainer.parentNode.insertBefore(
  expenseListPageSizeContainer,
  expenseListContainer.nextSibling
);

expenseListPageSizeSelect.addEventListener("change", (e) => {
  expenseListRowsPerPage = parseInt(e.target.value);
  expenseListCurrentPage = 1;
  renderExpenseListPage();
});

// Pagination buttons
const expenseListPagination = document.createElement("div");
expenseListPagination.className = "flex justify-center items-center gap-2 mt-3";
expenseListPagination.id = "expense-list-pagination";
expenseListPagination.style.display = "none";

const prevExpensePageBtn = document.createElement("button");
prevExpensePageBtn.textContent = "Prev";
prevExpensePageBtn.className =
  "px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-indigo-300";
prevExpensePageBtn.disabled = true;

const nextExpensePageBtn = document.createElement("button");
nextExpensePageBtn.textContent = "Next";
nextExpensePageBtn.className =
  "px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-indigo-300";
nextExpensePageBtn.disabled = true;

const expensePageInfo = document.createElement("span");
expensePageInfo.className = "text-gray-700 dark:text-gray-200";

expenseListPagination.appendChild(prevExpensePageBtn);
expenseListPagination.appendChild(expensePageInfo);
expenseListPagination.appendChild(nextExpensePageBtn);
expenseListContainer.parentNode.appendChild(expenseListPagination);

prevExpensePageBtn.addEventListener("click", () => {
  if (expenseListCurrentPage > 1) {
    expenseListCurrentPage--;
    renderExpenseListPage();
  }
});
nextExpensePageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(transactions.length / expenseListRowsPerPage);
  if (expenseListCurrentPage < totalPages) {
    expenseListCurrentPage++;
    renderExpenseListPage();
  }
});

function renderExpenseListPage() {
  const totalExpenses = transactions.length;
  if (totalExpenses === 0) {
    expenseListPagination.style.display = "none";
    expenseListPageSizeContainer.style.display = "none";
    expenseListContainer.innerHTML =
      "<li class='text-center text-gray-500 dark:text-gray-400'>No expenses yet</li>";
    return;
  }

  expenseListPagination.style.display = "flex";
  expenseListPageSizeContainer.style.display = "flex";

  const start = (expenseListCurrentPage - 1) * expenseListRowsPerPage;
  const end = start + expenseListRowsPerPage;
  const paginatedExpenses = transactions.slice(start, end);

  expenseListContainer.innerHTML = "";
  paginatedExpenses.forEach((t) => {
    const li = document.createElement("li");
    li.className =
      "flex justify-between items-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 shadow-sm";
    li.textContent = `${t.desc} [${t.category}] - ₹${t.amount}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className =
      "delete-btn bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-all";
    delBtn.onclick = () => deleteExpense(t.id);
    li.appendChild(delBtn);

    expenseListContainer.appendChild(li);
  });

  const totalPages = Math.ceil(totalExpenses / expenseListRowsPerPage);
  expensePageInfo.textContent = `Page ${expenseListCurrentPage} of ${totalPages}`;
  prevExpensePageBtn.disabled = expenseListCurrentPage === 1;
  nextExpensePageBtn.disabled = expenseListCurrentPage === totalPages;
}

// ===== Load Expenses =====
async function loadExpenses() {
  try {
    const { data } = await axios.get(`${base_url}/expense/get-expenses`);
    if (data.success) {
      transactions = data.expenses.map((exp) => ({
        id: exp.id,
        date: exp.createdAt ? exp.createdAt.split("T")[0] : "N/A",
        desc: exp.description || "No Description",
        category: exp.category || "General",
        type: "Expense",
        amount: exp.amount || 0,
      }));
      renderTransactionsPage();
      renderExpenseListPage();
    } else alert("Failed to load expenses: " + data.message);
  } catch (err) {
    console.error(err);
    alert("Error loading expenses");
  }
}
document.addEventListener("DOMContentLoaded", loadExpenses);

// ===== Add Expense =====
document
  .getElementById("expense-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = document.getElementById("amount").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;

    if (!amount || !description || !category) {
      alert("Please enter amount, description, and category");
      return;
    }

    try {
      const { data } = await axios.post(`${base_url}/expense/add-expense`, {
        amount,
        description,
        category,
      });
      if (data.success) {
        document.getElementById("expense-form").reset();
        loadExpenses();
      } else alert(data.message || "Failed to add expense!");
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    }
  });
// ===== Add Expense Using AI =====
document.getElementById("addExpenseAI").addEventListener("click", async () => {
  if (!isPremium) return alert("🚫 Only premium users can use AI features!");

  try {
    const amount = document.getElementById("amount").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!amount || !description)
      return alert("Please enter amount and description");

    // Send request to backend; category is optional
    const { data } = await axios.post(`${base_url}/expense/add-expense-ai`, {
      amount,
      description,
      category, // may be empty
    });

    if (data.success) {
      loadExpenses();
      // Optionally reset form
      document.getElementById("expense-form").reset();
    } else {
      alert(data.message || "AI could not process your expense.");
    }
  } catch (err) {
    console.error("Error using AI:", err);
    alert("⚠️ Error connecting to AI service");
  }
});

// ===== Delete Expense =====
async function deleteExpense(id) {
  try {
    const { data } = await axios.delete(
      `${base_url}/expense/delete-expense/${id}`
    );
    if (data.success) loadExpenses();
    else alert(data.message || "Failed to delete expense");
  } catch (err) {
    console.error(err);
    alert("Failed to delete expense");
  }
}

// ===== Premium Payment =====
premiumBtn.addEventListener("click", async () => {
  if (isPremium) return alert("You are already a premium user!");
  if (!userId) return alert("Please login first!");

  try {
    const { data } = await axios.post(`${base_url}/payment/create-order`, {
      amount: 100,
      userId: Number(userId),
    });
    if (!data.success)
      return alert(data.message || "Failed to create payment order");

    const cashfree = Cashfree({ mode: "sandbox" });
    await cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self",
    });
  } catch (err) {
    console.error(err);
    alert("Error initiating payment");
  }
});

// ===== Download & Toggle Dashboard =====
downloadBtn.addEventListener("click", async () => {
  if (!isPremium) return alert("🚫 Only premium users can download expenses!");
  try {
    const res = await axios.get(`${base_url}/expense/download-expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data && res.data.success) {
      document.getElementById("downloadResult").innerHTML = `
        <p class="font-medium">✅ Your expense file has been generated!</p>
        <a href="${res.data.fileURL}" target="_blank" class="text-indigo-500 underline font-semibold">
          Click here to download from AWS S3
        </a>`;
    } else alert(res.data.message || "Failed to download expenses.");
  } catch (err) {
    console.error(err);
    alert("⚠️ Error generating file. Please try again later.");
  }
});

toggleDashboardBtn.addEventListener("click", () => {
  fullDashboard.classList.toggle("hidden");
  toggleDashboardBtn.textContent = fullDashboard.classList.contains("hidden")
    ? "Show Expense Dashboard"
    : "Hide Expense Dashboard";
});

// ===== Leaderboard =====
let leaderboardData = [];
let leaderboardCurrentPage = 1;
let leaderboardRowsPerPage = parseInt(
  document.getElementById("leaderboardPageSize")?.value || 5
);

const prevLeaderboardPageBtn = document.getElementById("prevLeaderboardPage");
const nextLeaderboardPageBtn = document.getElementById("nextLeaderboardPage");
const leaderboardPageInfo = document.getElementById("leaderboardPageInfo");
const leaderboardPageSizeSelect = document.getElementById(
  "leaderboardPageSize"
);

function renderLeaderboardPage() {
  const start = (leaderboardCurrentPage - 1) * leaderboardRowsPerPage;
  const end = start + leaderboardRowsPerPage;
  const paginated = leaderboardData.slice(start, end);

  leaderboardList.innerHTML = "";
  paginated.forEach((user, index) => {
    const li = document.createElement("li");
    li.textContent = `${start + index + 1}. ${user.name} - ₹${
      user.totalExpenses
    }`;
    li.className =
      "bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 mb-1 shadow-sm";
    if (user.id === Number(userId)) li.classList.add("current-user");
    leaderboardList.appendChild(li);
  });

  const totalPages = Math.ceil(leaderboardData.length / leaderboardRowsPerPage);
  leaderboardPageInfo.textContent = `Page ${leaderboardCurrentPage} of ${totalPages}`;
  prevLeaderboardPageBtn.disabled = leaderboardCurrentPage === 1;
  nextLeaderboardPageBtn.disabled = leaderboardCurrentPage === totalPages;
}

// Rows per page change
leaderboardPageSizeSelect?.addEventListener("change", (e) => {
  leaderboardRowsPerPage = parseInt(e.target.value);
  leaderboardCurrentPage = 1;
  renderLeaderboardPage();
});

// Pagination buttons
prevLeaderboardPageBtn?.addEventListener("click", () => {
  if (leaderboardCurrentPage > 1) {
    leaderboardCurrentPage--;
    renderLeaderboardPage();
  }
});

nextLeaderboardPageBtn?.addEventListener("click", () => {
  const totalPages = Math.ceil(leaderboardData.length / leaderboardRowsPerPage);
  if (leaderboardCurrentPage < totalPages) {
    leaderboardCurrentPage++;
    renderLeaderboardPage();
  }
});

// Fetch and toggle leaderboard
leaderboardBtn.addEventListener("click", async () => {
  if (!token || !userId) return alert("Please login first!");

  if (!leaderboardContainer.classList.contains("hidden")) {
    leaderboardContainer.classList.add("hidden");
    leaderboardBtn.textContent = "Show Leaderboard";
    return;
  }

  try {
    const { data } = await axios.get(`${base_url}/premium/leaderboard`);
    if (!data.success) return alert("Failed to fetch leaderboard");

    leaderboardData = data.leaderboard;
    leaderboardCurrentPage = 1;
    renderLeaderboardPage();

    leaderboardContainer.classList.remove("hidden");
    leaderboardBtn.textContent = "Hide Leaderboard";
  } catch (err) {
    console.error(err);
    alert("Error fetching leaderboard");
  }
});

// ===== Logout =====
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "./index.html";
});
