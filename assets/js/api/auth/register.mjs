
export const API_KEY = "cf7dc630-134f-4432-8cca-cc389127181";

export const API_BASE = "https://v2.api.noroff.dev";
export const API_AUTH = "/auth";
export const API_REGISTER = "/register";
export const API_LOGIN = "/login";
export const API_KEY_URL = "/create-api-key";
export const API_POSTS = "/blog/posts/<name>"

export async function register(name, email, password) {
    const response = await fetch(API_BASE + API_AUTH + API_REGISTER, {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

    if (response) {
        return await response.json();
    }

    throw new Error("Could not register the account");
}


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

export async function onAuth(event) {
    event.preventDefault();
    const name = event.target.name.value;
    const email = event.target.email.value;
    const password = event.target.password.value;

    if (event.submitter.dataset.auth === "login") {
        await login(email, password);
    } else {
        await register(name, email, password);
        await login(email, password);
    }
  
    const posts = await getPosts();
    console.log(posts);
}

//*this is making error on my code for create post*//

export function setAuthListener() {
    registerEventListener("register-form", onAuth);
}

export function registerEventListener(formName, callback) {
    const form = document.getElementById(formName);
    if (!form) {
        return;
    }
    form.addEventListener("submit", callback);
}

setAuthListener();
console.log("Auth listener is set");


export function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// function remove(key) {
// 	localStorage.removeItem(key);
// }

export async function getPosts() {
    const response = await fetch(API_BASE + "/blog/posts/<name>", { 
        headers: { 
            Authorization: `Bearer ${load("token")}`,
            "X-Noroff-API-Key": API_KEY
        } 
    });
    return await response.json();
}

export function load(key) {
    return JSON.parse(localStorage.getItem(key));
}



async function createPost(event) {
  event.preventDefault(); // Prevent the default form submission

  // Get the form data
  const title = document.getElementById('title').value;
  const body = document.getElementById('body').value;
  const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
  const mediaUrl = document.getElementById('mediaUrl').value;
  const mediaAlt = document.getElementById('mediaAlt').value;

  // Create the post data object
  const postData = {
    title,
    body,
    tags,
    media: {
      url: mediaUrl,
      alt: mediaAlt
    }
  };

  try {
    // Send the POST request to create the new post
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    // Check if the request was successful
    if (response) {
      const data = await response.json();
      console.log('New post created:', data.data);
      // You can redirect the user or show a success message here
    } else {
      console.error('Failed to create post:', response.status);
      // Handle the error case (e.g., display an error message)
    }
  } catch (error) {
    console.error('An error occurred:', error);
    // Handle any network or other errors
  }
}
// Replace <name> with your registered username
const apiUrl = `https://api.noroff.dev/v2/blog/posts/<ghfusnscshb>`;

// Get the form element and add an event listener for form submission
const postForm = document.getElementById('postForm');
postForm.addEventListener('submit', createPost);

async function createPost(event) {
  event.preventDefault(); // Prevent the default form submission

  // Get the form data
  const title = document.getElementById('title').value;
  const body = document.getElementById('body').value;
  const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
  const mediaUrl = document.getElementById('mediaUrl').value;
  const mediaAlt = document.getElementById('mediaAlt').value;

  // Create the post data object
  const postData = {
    title,
    body,
    tags,
    media: {
      url: mediaUrl,
      alt: mediaAlt
    }
  };

  try {
    // Send the POST request to create the new post
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    // Check if the request was successful
    if (response) {
      const data = await response.json();
      console.log('New post created:', data.data);
      // You can redirect the user or show a success message here
    } else {
      console.error('Failed to create post:', response.status);
      // Handle the error case (e.g., display an error message)
    }
  } catch (error) {
    console.error('An error occurred:', error);
    // Handle any network or other errors
  }
}

    document.addEventListener('DOMContentLoaded', function() {
    const postForm = document.getElementById('postForm');
    postForm.addEventListener('submit', createPost);
  });

  