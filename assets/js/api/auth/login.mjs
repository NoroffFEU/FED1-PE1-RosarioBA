import { API_BASE, API_AUTH, API_LOGIN } from "../utils/constants.js";
import { save } from "../utils/storage.js";

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

    throw new Error("could not login the account");
}