const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const formTitle = document.getElementById("formTitle");
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

// 🔹 Switch to Signup
showSignup.addEventListener("click", () => {
  loginForm.style.display = "none";
  signupForm.style.display = "flex";
  formTitle.textContent = "Sign Up";
});

// 🔹 Switch to Login
showLogin.addEventListener("click", () => {
  signupForm.style.display = "none";
  loginForm.style.display = "flex";
  formTitle.textContent = "Login";
});

// 🔹 Signup Submit
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  try {
    const res = await axios.post("http://localhost:5000/user/signup", {
      name,
      email,
      password,
    });
    alert(res.data.message);
    signupForm.reset();
  } catch (err) {
    console.error("Signup Error:", err);
    alert(err.response?.data?.message || "Signup failed. Try again.");
  }
});

// 🔹 Login Submit
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await axios.post("http://localhost:5000/user/login", {
      email,
      password,
    });

    const data = res.data;
    if (data.success) {
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("token", data.token);
      localStorage.setItem("isPremium", data.isPremium ? "true" : "false");
      window.location.href = "./expense.html";
    } else {
      alert(data.message || "Login failed!");
    }
  } catch (err) {
    console.error("Login Error:", err);
    alert(err.response?.data?.message || "Login failed. Try again.");
  }
});
