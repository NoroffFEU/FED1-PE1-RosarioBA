export function setAuthListener() {
    const form = document.querySelector("#loginForm");

    form.setAuthListener("submit", (event) => {
        const form = event.target;
        const formData = new FormData(form);
        const profile = Object.fromEntries(formData.entries());
        console.log('it works!');
    });
}