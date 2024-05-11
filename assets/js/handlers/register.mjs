
export function setRegisterFormListener() {
    const form = document.querySelector("#registerForm");

    form.addEventListener("submit", (event) => {
        const form = event.target;
        const formData = new FormData(form);
        const profile = Object.fromEntries(formData.entries());
        console.log('it works!');
    });
}