const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const base_url = "http://localhost:5000";

if (!token) {
  alert("Please login first!");
  window.location.href = "./index.html";
}

// Axios default header for Authorization
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// ✅ Add Expense
document
  .getElementById("expense-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = document.getElementById("amount").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;

    if (!amount || !description) {
      alert("Please enter amount and description");
      return;
    }

    const expenseData = { amount, description };
    if (category && category.trim() !== "") {
      expenseData.category = category;
    }

    try {
      const { data } = await axios.post(
        `${base_url}/expense/add-expense`,
        expenseData
      );

      console.log("Add expense response:", data);

      if (data.success) {
        document.getElementById("expense-form").reset();
        loadExpenses();
      } else {
        alert(data.message || "Failed to add expense!");
      }
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to connect to server");
    }
  });
function renderExpenseList() {
  const list = document.getElementById("expense-list");
  list.innerHTML = "";

  if (transactions.length === 0) {
    list.innerHTML = "<li>No expenses yet</li>";
    return;
  }

  transactions.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = `${t.desc} [${t.category}] - ₹${t.amount}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.classList.add("delete-btn");
    delBtn.onclick = () => deleteExpense(t.id);
    li.appendChild(delBtn);

    list.appendChild(li);
  });
}

let transactions = [];
let currentPage = 1;
let rowsPerPage = parseInt(localStorage.getItem("pageSize")) || 5;
// ✅ Load Expenses
async function loadExpenses() {
  try {
    const { data } = await axios.get(
      `${base_url}/expense/get-expenses`
    );

    console.log("Loaded expenses:", data);

    if (data.success) {
      // Convert backend expense objects into the same shape as your transaction table
      transactions = data.expenses.map((exp) => ({
        id: exp.id,
        date: exp.createdAt ? exp.createdAt.split("T")[0] : "N/A", // or exp.date if available
        desc: exp.description || "No Description",
        category: exp.category || "General",
        type: "Expense", // or "Income" if you store that in DB
        amount: exp.amount || 0,
      }));
      renderTransactionsPage();

      renderExpenseList();
    } else {
      alert("Failed to load expenses: " + data.message);
    }
  } catch (err) {
    console.error("Error loading expenses:", err);
    alert("Error loading expenses");
  }
}

// ✅ Delete Expense
async function deleteExpense(id) {
  try {
    const { data } = await axios.delete(
      `${base_url}/expense/delete-expense/${id}`
    );
    if (data.success) {
      await loadExpenses();
    } else {
      alert(data.message || "Failed to delete expense");
    }
  } catch (err) {
    console.error("Error deleting expense:", err);
    alert("Failed to delete expense");
  }
}
// Load expenses on page load
document.addEventListener("DOMContentLoaded", loadExpenses);

// ✅ Cashfree Payment Integration
const premiumBtn = document.getElementById("premium-btn");
premiumBtn.addEventListener("click", async () => {
  const amount = 100;

  if (!userId) {
    alert("Please login first!");
    return;
  }

  try {
    const { data } = await axios.post(
      `${base_url}/payment/create-order`,
      {
        amount,
        userId: Number(userId),
      }
    );

    if (!data.success) {
      alert(data.message || "Failed to create payment order");
      return;
    }

    const orderId = data.order_id;
    const cashfree = Cashfree({ mode: "sandbox" });

    const checkoutOptions = {
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self",
    };

    const result = await cashfree.checkout(checkoutOptions);
    console.log("Payment result:", result);

    let finalStatus = "PENDING";

    while (finalStatus === "PENDING") {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await axios.get(
        `${base_url}/payment/status/${orderId}`
      );
      const statusData = statusRes.data;

      console.log("Payment status check:", statusData);

      if (statusData.orderStatus === "SUCCESS") {
        finalStatus = "SUCCESS";
        alert("✅ Transaction successful! You are now a premium user.");
        localStorage.setItem("isPremium", "true");
        leaderboardBtn.style.display = "block";
        showPremiumUI();
        break;
      } else if (statusData.orderStatus === "FAILED") {
        finalStatus = "FAILED";
        alert("❌ Transaction failed. Please try again.");
        break;
      }
    }

    if (finalStatus === "PENDING") {
      alert("⚠️ Payment still pending. Please refresh later.");
    }
  } catch (err) {
    console.error("Error initiating payment:", err);
    alert("Error initiating payment");
  }
});

// ✅ Verify Payment After Redirect
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("order_id");

  if (orderId) {
    console.log("Detected payment redirect, checking status for:", orderId);

    try {
      const { data } = await axios.get(
        `${base_url}/payment/status/${orderId}`
      );

      console.log("Payment verification result:", data);

      if (data.orderStatus === "SUCCESS") {
        alert("✅ Payment successful! You are now a Premium User.");
        localStorage.setItem("isPremium", "true");
        leaderboardBtn.style.display = "block";
        showPremiumUI();
      } else if (data.orderStatus === "FAILED") {
        alert("❌ Payment failed. Please try again.");
      } else {
        alert("⚠️ Payment pending. Please check again later.");
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error("Error verifying payment:", err);
      alert("Failed to verify payment status. Please try again later.");
    }
  }

  if (localStorage.getItem("isPremium") === "true") {
    showPremiumUI();
  }
});

function showPremiumUI() {
  const premiumBtn = document.getElementById("premium-btn");
  premiumBtn.textContent = "🌟 Premium User";
  premiumBtn.disabled = true;
  premiumBtn.classList.add("premium-active");
  document.getElementById("leaderboard-btn").style.display = "block";
}

// ✅ Leaderboard
const leaderboardBtn = document.getElementById("leaderboard-btn");
const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardList = document.getElementById("leaderboard-list");

const isPremium = localStorage.getItem("isPremium") === "true";

if (!token || !userId) {
  leaderboardBtn.style.display = "none";
} else if (isPremium) {
  leaderboardBtn.style.display = "block";
} else {
  leaderboardBtn.style.display = "none";
}

leaderboardBtn.addEventListener("click", async () => {
  if (!token || !userId) return alert("Please login first!");
  try {
    const { data } = await axios.get(
      `${base_url}/premium/leaderboard`
    );
    if (!data.success) return alert("Failed to fetch leaderboard");

    leaderboardList.innerHTML = "";
    data.leaderboard.forEach((user, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${user.name} - ₹${user.totalExpenses}`;
      if (user.id === Number(userId)) li.classList.add("current-user");
      leaderboardList.appendChild(li);
    });
    leaderboardContainer.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Error fetching leaderboard");
  }
});

// ✅ Logout
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  alert("Logged out successfully!");
  window.location.href = "./index.html";
});
//Sample mock data

const downloadBtn = document.getElementById("downloadBtn");
const toggleDashboardBtn = document.getElementById("toggleDashboardBtn");
const fullDashboard = document.getElementById("full-dashboard");

// Enable buttons only for premium users
if (isPremium) {
  downloadBtn.disabled = false;
  downloadBtn.classList.remove("disabled");
  toggleDashboardBtn.disabled = false;
  toggleDashboardBtn.classList.remove("disabled");
} else {
  downloadBtn.disabled = true;
  downloadBtn.classList.add("disabled");
  toggleDashboardBtn.disabled = true;
  toggleDashboardBtn.classList.add("disabled");
}

async function downloadExpenses() {
  if (!isPremium) {
    alert("🚫 Only premium users can download expenses!");
    return;
  }

  try {
    const res = await axios.get(
      `${base_url}/expense/download-expenses`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.data && res.data.success) {
      const s3Url = res.data.fileURL;

      // ✅ Show the S3 link dynamically on screen
      const resultContainer =
        document.getElementById("downloadResult") ||
        (() => {
          const div = document.createElement("div");
          div.id = "downloadResult";
          div.style.marginTop = "15px";
          div.style.textAlign = "center";
          document.body.appendChild(div);
          return div;
        })();

      resultContainer.innerHTML = `
        <p style="font-weight: 500;">✅ Your expense file has been generated!</p>
        <a href="${s3Url}" target="_blank" style="
          color: #007bff;
          text-decoration: underline;
          font-weight: 600;
        ">
          Click here to download from AWS S3
        </a>
      `;
    } else {
      alert(res.data.message || "Failed to download expenses.");
    }
  } catch (err) {
    console.error("❌ Error downloading expenses:", err);

    if (err.response && err.response.status === 401) {
      alert("🚫 You are not a premium user!");
    } else {
      alert("⚠️ Error generating file. Please try again later.");
    }
  }
}

// ✅ Attach event listener
downloadBtn.addEventListener("click", downloadExpenses);

// Render transactions function
function renderTransactions(data) {
  const transactionBody = document.getElementById("transactionBody");

  const totalExpense = document.getElementById("totalExpense");

  transactionBody.innerHTML = "";
  let incomeTotal = 0;
  let expenseTotal = 0;

  data.forEach((t) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.desc}</td>
      <td>${t.category}</td>
      <td>${t.type}</td>
      <td>₹${t.amount}</td>
    `;
    transactionBody.appendChild(row);
  });

  totalExpense.textContent = `₹${expenseTotal}`;
}
// Toggle dashboard visibility
toggleDashboardBtn.addEventListener("click", () => {
  if (fullDashboard.style.display === "none") {
    fullDashboard.style.display = "block";
    toggleDashboardBtn.textContent = "Hide Expense Dashboard";
    //renderTransactions(transactions);
  } else {
    fullDashboard.style.display = "none";
    toggleDashboardBtn.textContent = "Show Expense Dashboard";
  }
});

// Pagination variables

// Page size selector
const pageSizeSelect = document.getElementById("pageSize") || 10;
pageSizeSelect.value = rowsPerPage;

// Update page size when user changes it
pageSizeSelect.addEventListener("change", (e) => {
  rowsPerPage = parseInt(e.target.value);
  localStorage.setItem("pageSize", rowsPerPage);
  currentPage = 1; // reset to first page
  renderTransactionsPage();
});
// Show 2 expenses per page

// Pagination elements
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

// Render transactions for the current page
// Render transactions for the current page
function renderTransactionsPage() {
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = transactions.slice(start, end);

  const transactionBody = document.getElementById("transactionBody");
  transactionBody.innerHTML = "";

  // Only calculate total expense
  let expenseTotal = 0;

  transactions.forEach((t) => {
    if (t.type === "Expense") expenseTotal += t.amount;
  });

  // Render only current page rows
  paginatedData.forEach((t) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.desc}</td>
      <td>${t.category}</td>
      <td>${t.type}</td>
      <td>₹${t.amount}</td>
    `;
    transactionBody.appendChild(row);
  });

  // Update total expense only
  document.getElementById("totalExpense").textContent = `₹${expenseTotal}`;

  const totalPages = Math.ceil(transactions.length / rowsPerPage) || 1;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled =
    currentPage === totalPages || transactions.length === 0;
}

// Event listeners for pagination
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTransactionsPage(transactions);
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTransactionsPage(transactions);
  }
});

// Initially load first page
//renderTransactionsPage(transactions);
