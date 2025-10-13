const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
if (!token) {
  alert("Please login first!");
  window.location.href = "./index.html";
}

// Handle form submission
// add expense
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

    // ✅ Only send category if user selected one
    if (category && category.trim() !== "") {
      expenseData.category = category;
    }

    try {
      const res = await fetch("http://localhost:5000/expense/add-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });

      const data = await res.json();
      console.log("Add expense response:", data);

      if (res.ok && data.success) {
        document.getElementById("expense-form").reset();
        loadExpenses(); // refresh list
      } else {
        alert(data.message || "Failed to add expense!");
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "./index.html";
        }
      }
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to connect to server");
    }
  });

// Load existing expenses
async function loadExpenses() {
  try {
    const res = await fetch("http://localhost:5000/expense/get-expenses", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    console.log("Loaded expenses:", data);

    if (res.ok && data.success) {
      const list = document.getElementById("expense-list");
      list.innerHTML = "";
      data.expenses.forEach((exp) => {
        const li = document.createElement("li");
        li.textContent = `${exp.description} - ₹${exp.amount} (${exp.category})`;

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.classList.add("delete-btn");
        delBtn.onclick = () => deleteExpense(exp.id);
        li.appendChild(delBtn);

        list.appendChild(li);
      });
    } else {
      console.warn("Failed to load expenses:", data.message);
    }
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// Delete expense
async function deleteExpense(id) {
  const res = await fetch(
    `http://localhost:5000/expense/delete-expense/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json();
  if (res.ok && data.success) {
    loadExpenses();
  } else {
    alert(data.message || "Failed to delete expense");
  }
}
// Load expenses on page load
document.addEventListener("DOMContentLoaded", loadExpenses);

//Cashfree Payment Integration
const premiumBtn = document.getElementById("premium-btn");
premiumBtn.addEventListener("click", async () => {
  //const userId = localStorage.getItem("userId"); // fetch stored userId
  const amount = 100; // hardcoded amount for premium upgrade

  console.log("Premium button clicked", { userId, amount });

  if (!userId) {
    alert("Please login first!");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        userId: Number(userId), // convert to number
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to create payment order");
      return;
    }

    // Initialize Cashfree checkout
    const orderId = data.order_id;

    const cashfree = Cashfree({ mode: "sandbox" });

    const checkoutOptions = {
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self",
    };

    const result = await cashfree.checkout(checkoutOptions);

    console.log("Payment result:", result);

    // ✅ After checkout, check order status directly from backend (Cashfree API)
    let finalStatus = "PENDING";

    while (finalStatus === "PENDING") {
      await new Promise((r) => setTimeout(r, 3000)); // Wait 3s between checks

      const statusRes = await fetch(
        `http://localhost:5000/payment/status/${orderId}`
      );
      const statusData = await statusRes.json();

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

// ✅ Check payment status after Cashfree redirect
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("order_id");

  if (orderId) {
    console.log("Detected payment redirect, checking status for:", orderId);

    try {
      const res = await fetch(
        `http://localhost:5000/payment/status/${orderId}`
      );
      const data = await res.json();

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

      // Clean URL (remove ?order_id=... after showing alert)
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error("Error verifying payment:", err);
      alert("Failed to verify payment status. Please try again later.");
    }
  }

  // Check if already premium
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

const leaderboardBtn = document.getElementById("leaderboard-btn");
const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardList = document.getElementById("leaderboard-list");

// Show leaderboard button only for premium users
const isPremium = localStorage.getItem("isPremium") === "true";

if (!token || !userId) {
  // User not logged in
  leaderboardBtn.style.display = "none";
} else if (isPremium) {
  leaderboardBtn.style.display = "block";
} else {
  leaderboardBtn.style.display = "none";
}
leaderboardBtn.addEventListener("click", async () => {
  if (!token || !userId) return alert("Please login first!");
  try {
    const res = await fetch("http://localhost:5000/premium/leaderboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
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

// Logout
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  // localStorage.removeItem("isPremium");
  alert("Logged out successfully!");
  window.location.href = "./index.html";
});
