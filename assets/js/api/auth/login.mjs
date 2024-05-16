import { save } from "../../storage/save.mjs";
import { API_AUTH, API_BASE, API_LOGIN} from "../constants.mjs";
import { getPosts } from "./register.mjs";

export async function login(email, password) {
    const response = await fetch(API_BASE + API_AUTH + API_LOGIN, {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        const { accessToken, ...profile } = (await response.json()).data;
        save("token", accessToken);
        console.log("Token saved:", accessToken);
        save("profile", profile);
        return profile;
    }

    throw new Error("Could not login the account");
}


export async function onLogin(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
        await login(email, password);
        const posts = await getPosts();
        console.log(posts);
    } catch (error) {
        console.error("Error logging in:", error.message);
    }
}

export function setLoginListener() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", onLogin);
}
