export async function getPosts() {
    const response = await fetch(API_BASE + "/blog/posts", { 
        headers: { 
            Authorization: `Bearer ${load("token")}`,
            "X-Noroff-API-Key": API_KEY
        } 
    });
    return await response.json();
}