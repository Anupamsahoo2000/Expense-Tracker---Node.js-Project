const userId = localStorage.getItem("userId");
if (!userId) {
  alert("Please login first!");
  window.location.href = "index.html";
}

async function loadExpenses() {
  const res = await fetch(
    `http://localhost:5000/expense/get-expenses?userId=${userId}`
  );
  const data = await res.json();

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
}

document
  .getElementById("expense-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = document.getElementById("amount").value;
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;

    const res = await fetch("http://localhost:5000/expense/add-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, description, category, userId }),
    });

    const data = await res.json();
    if (data.success) {
      loadExpenses();
      document.getElementById("expense-form").reset();
    }
  });

async function deleteExpense(id) {
  const res = await fetch(
    `http://localhost:5000/expense/delete-expense/${id}`,
    {
      method: "DELETE",
    }
  );

  const data = await res.json();
  if (data.success) {
    loadExpenses();
  }
}

loadExpenses();
