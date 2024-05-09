const form = document.querySelector("registerForm");

form.addEventListener("submit", (event) => {
 const form = event.target;
 const name = form.name.value;
 const email = form.email.value;
 const password = form.password.value;
})