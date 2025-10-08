const token = localStorage.getItem("token");
if (!token) {
  alert("Please login first!");
  window.location.href = "./index.html";
}

// Handle form submission
document
  .getElementById("expense-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = document.getElementById("amount").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;

    if (!amount || !description || !category) {
      alert("All fields are required!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/expense/add-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, description, category }),
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

const payBtn = document.getElementById("pay-btn");

payBtn.addEventListener("click", async () => {
  const amount = 100; // testing amount

  try {
    const res = await fetch("http://localhost:5000/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to create payment order");
      return;
    }

    const cashfree = Cashfree({ mode: "sandbox" });

    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self",
    });
  } catch (err) {
    console.error(err);
    alert("Error initiating payment");
  }
});
