const API_KEY = "cf7dc630-134f-4432-8cca-cc389127181";
const API_BASE = "https://v2.api.noroff.dev";
const API_AUTH = "/auth";
const API_REGISTER = "/register";
const API_LOGIN = "/login";
const API_POSTS_BASE = "/blog/posts";

async function register(name, email, password) {
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

    throw new Error("Could not register the account");
}

async function login(email, password) {
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
        save("profile", profile);
        return profile;
    }

    throw new Error("Could not login the account");
}

async function onAuth(event) {
    event.preventDefault();
    const name = event.target.name.value;
    const email = event.target.email.value;
    const password = event.target.password.value;

    if (event.submitter.innerText.toLowerCase() === "login") {
        await login(email, password);
    } else {
        await register(name, email, password);
        await login(email, password);
    }

    const posts = await getPosts();
    console.log(posts);
}

function setAuthListener() {
    registerEventListener("register-form", onAuth);
}

function registerEventListener(formId, callback) {
    const form = document.getElementById(formId);

    if (!form) {
        console.error(`Form with id ${formId} not found`);
        return;
    }

    form.addEventListener("submit", callback);
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function load(key) {
    return JSON.parse(localStorage.getItem(key));
}

async function getPosts() {
    const profile = load("profile");
    if (!profile) {
        throw new Error("Profile not found. Please log in.");
    }
    const response = await fetch(`${API_BASE}${API_POSTS_BASE}/${profile.name}`, {
        headers: {
            Authorization: `Bearer ${load("token")}`,
            "X-Noroff-API-Key": API_KEY,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

async function createPost(postData) {
    const profile = load("profile");
    if (!profile) {
        throw new Error("Profile not found. Please log in.");
    }
    const createPostURL = `${API_BASE}${API_POSTS_BASE}/${profile.name}`;

    console.log("Creating post with URL:", createPostURL);
    console.log("Post data:", postData);

    const response = await fetch(createPostURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${load("token")}`,
            "X-Noroff-API-Key": API_KEY,
        },
        body: JSON.stringify(postData),
    });

    if (!response.ok) {
        const errorResponse = await response.text(); // Get more details about the error
        console.error("Error response from server:", errorResponse);
        throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

function setCreatePostFormListener() {
    const form = document.querySelector("#createPost");

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const postData = Object.fromEntries(formData.entries());

            const tagsInput = document.getElementById('tags').value;
            const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
            postData.tags = tags; // 

            try {
                const newPost = await createPost(postData);
                console.log('New post created:', newPost.data);
                // You can redirect the user or show a success message here
            } catch (error) {
                console.error('An error occurred:', error);
                // Handle any network or other errors
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("register-form")) {
        setAuthListener();
    }

    if (document.getElementById("createPost")) {
        setCreatePostFormListener();
    }

    console.log("Event listeners are set");
});

export { createPost };

async function fetchBlogPosts() {
    try {
      const posts = await getPosts();
      return posts.data;
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
  }
  
  function renderBlogPosts(posts) {
    const blogPostsContainer = document.getElementById('blogPostsContainer');
    blogPostsContainer.innerHTML = ''; // Clear the container before rendering new posts
  
    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('blog-post');
  
      const titleElement = document.createElement('h2');
      const titleLink = document.createElement('a');
      titleLink.href = `post/index.html?id=${post.id}`; // Link to post/index.html with post ID
      titleLink.textContent = post.title;
      titleElement.appendChild(titleLink);
  
      const imageElement = document.createElement('img');
      imageElement.src = post.media;
      imageElement.alt = post.title;
  
      postElement.appendChild(titleElement);
      postElement.appendChild(imageElement);
      blogPostsContainer.appendChild(postElement);
    });
  }
  
  async function loadBlogPosts() {
    const posts = await fetchBlogPosts();
    renderBlogPosts(posts);
  }
  
  // Call the loadBlogPosts function when the page loads or when needed
  window.addEventListener('load', loadBlogPosts);

  function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  async function fetchSinglePost(postId) {
    try {
    const response = await fetch(`${API_BASE}${API_POSTS_BASE}/${postId}`, {
        headers: {
        'Authorization': `Bearer ${load('token')}`,
        'X-Noroff-API-Key': API_KEY,
        },
    });

    if (response.ok) {
        return await response.json();
    }

    throw new Error('Failed to fetch post');
    } catch (error) {
    console.error('Error fetching post:', error);
    return null;
    }
}

  function renderSinglePost(post) {
    const singlePostContainer = document.getElementById('singlePostContainer');
    singlePostContainer.innerHTML = ''; // Clear the container before rendering the post
  
    const titleElement = document.createElement('h1');
    titleElement.textContent = post.title;
  
    const bodyElement = document.createElement('p');
    bodyElement.textContent = post.body;
  
    const imageElement = document.createElement('img');
    imageElement.src = post.media;
    imageElement.alt = post.title;
  
    // Add other post details as needed (tags, author, etc.)
  
    singlePostContainer.appendChild(titleElement);
    singlePostContainer.appendChild(imageElement);
    singlePostContainer.appendChild(bodyElement);
  }
  
  async function loadSinglePost() {
    const postId = getPostIdFromUrl();
    if (postId) {
      const post = await fetchSinglePost(postId);
      if (post) {
        renderSinglePost(post.data);
      } else {
        console.error('Post not found');
      }
    }
  }
  
  // Call the loadSinglePost function when the post/index.html page loads
  window.addEventListener('load', () => {
    loadBlogPosts();
    loadSinglePost();
  });

