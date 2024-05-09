// export const API_BASE = "https://v2.api.noroff.dev";
// export const API_AUTH = "/auth";
// export const API_REGISTER = "/register";
// export const API_LOGIN = "/login";
// export const API_KEY_URL = "/create-api-key";




// export async function getAPIKey() {
//     const accessToken = load("token");
//     console.log("Access Token:", accessToken);

//     const response = await fetch(API_BASE + API_AUTH + API_KEY_URL, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${load("token")}`,
//         },
//         body: JSON.stringify({
//             name: "My API Key",
//         }),
//     });

//     if (response.ok) {
//         return await response.json();
//     }

//     console.error(await response.json());
//     throw new Error("could not get the API key");
// }






// }

// export function setAuthListener() {
//     document.forms.auth.addEventListener("submit", onAuth);
// }


//     //setAuthListener();

//     getAPIKey().then(console.log)