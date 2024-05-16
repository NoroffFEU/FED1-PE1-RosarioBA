import { API_POSTS, API_BASE } from "../constants.mjs";

import { load } from "../assets/js/storage/load.mjs";

export async function getPosts() {
    const response = await fetch(API_BASE + API_POSTS, { 
        headers: { 
            Authorization: `Bearer ${load("token")}`,
            "X-Noroff-API-Key": API_KEY
        } 
    });
    return await response.json();
}

