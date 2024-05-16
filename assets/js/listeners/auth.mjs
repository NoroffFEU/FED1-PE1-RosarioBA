import { onAuth } from "../events/onauth.mjs";

export function setAuthListener() {
    const form = document.getElementById("register-form");
    form.addEventListener("submit", onAuth);
}
