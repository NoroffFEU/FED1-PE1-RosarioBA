export async function register(name, email, password) {
    const response = await fetch(API_BASE + API_AUTH + API_REGISTER, {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
        return await response.json();
    }

    throw new Error("could not register the account");
}


// const form = document.querySelector("registerForm");

// form.addEventListener("submit", (event) => {
//  const form = event.target;
//  const name = form.name.value;
//  const email = form.email.value;
//  const password = form.password.value;
// })