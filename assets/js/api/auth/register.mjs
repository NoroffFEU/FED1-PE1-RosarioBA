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

    if (event.srcElement.id === "login-form") {
        await login(email, password);
    } else {
        await register(name, email, password);
        await login(email, password);
    }
    window.location.href = "/"; // Redirect to the home page
}

function setAuthListeners() {
    registerEventListener("register-form", onAuth);
    registerEventListener("login-form", onAuth);
    registerEventListener("create-post-form", onCreatePost);
    registerEventListener("author-select-form", onSelectAuthor);
}

function registerEventListener(formId, callback) {
    const form = document.getElementById(formId);

    if (!form) {
        console.log(`Form with id ${formId} not found`);
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

async function getPosts(profileName) {
    if (!profileName) {
        throw new Error("ProfileName missing.");
    }
    const response = await fetch(`${API_BASE}${API_POSTS_BASE}/${profileName}`, {
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
        const errorResponse = await response.text();
        console.error("Error response from server:", errorResponse);
        throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
    }

    const newPost = await response.json();
    const newPostId = newPost.data.id; // Get the ID of the new post
    
    return newPostId; // Return the new post ID
}

async function onCreatePost(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const postData = Object.fromEntries(formData.entries());
    

    const tagsInput = document.getElementById('tags').value;
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
    postData.tags = tags;

    postData.media = {
        url: postData.mediaUrl,
        alt: postData.mediaAlt,
    };

    delete postData.mediaUrl;
    delete postData.mediaAlt;

    try {
        const newPostId = await createPost(postData);
        console.log('New post created with ID:', newPostId);

        // Redirect to the single post page
        window.location.href = `/post/index.html?id=${newPostId}`;
    } catch (error) {
        console.error('An error occurred:', error);
        // Handle any network or other errors
    }
}
/*
document.addEventListener("DOMContentLoaded", () => {
    setAuthListeners();
});
 */


export { createPost };

async function fetchBlogPosts(profileName) {
    try {
        const posts = await getPosts(profileName);
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

    function renderBlogPosts(posts) {
  const blogPostsContainer = document.getElementById('blogPostsContainer');
  blogPostsContainer.innerHTML = ''; // Clear the container before rendering new posts

      const imageElement = document.createElement('img');
      if (post.media) {
        imageElement.src = post.media;
      } else {
        imageElement.src = 'https://via.placeholder.com/300';
      }
      imageElement.alt = post.title;
  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.classList.add('blog-post');

    const imageElement = document.createElement('img');
    if (post.media && post.media.url) {
      imageElement.src = post.media.url;
    } else {
      imageElement.src = 'https://via.placeholder.com/300';
    }
    imageElement.alt = post.title;
    postElement.appendChild(imageElement);

      postElement.appendChild(titleElement);
      postElement.appendChild(imageElement);
    const contentElement = document.createElement('div');
    contentElement.classList.add('blog-post-content');

      blogPostsContainer.appendChild(postElement);
    });
  }
  
  async function loadBlogPosts(profileName) {
    const posts = await fetchBlogPosts(profileName);
    renderBlogPosts(posts);
}

function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  async function fetchSinglePost(postId) {
    try {
      const profile = load("profile");
      if (!profile) {
        throw new Error("Profile not found. Please log in.");
      }
      const response = await fetch(`${API_BASE}${API_POSTS_BASE}/${profile.name}/${postId}`, {
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
    imageElement.src = post.media.url; 
    imageElement.alt = post.media.alt;
  
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


  async function onLogout(event) {
    event.preventDefault();
    localStorage.clear();
    console.log("logged out");
    // refresh the page
    window.location.reload();
} 

// return true if logged in
function loadUserProfile() {
    const profileElement = document.getElementById('user-profile');
  
    const profile = load('profile');
    if (profile) {
        profileElement.textContent = `Logged in as: ${profile.name}`;
        profileElement.insertAdjacentHTML('beforeend', '<button id="logout">Logout</button>');
        const logoutButton = document.getElementById('logout');
        if (logoutButton) {
            logoutButton.addEventListener('click', onLogout);
        }
    }
    return profile;
  }
  
  async function addCreatePostButton() {
    const profileElement = document.getElementById('create-post-button-container');
    if (!profileElement) return;

    const createPostButton = document.createElement('button');
    createPostButton.textContent = 'Create Post';
    createPostButton.addEventListener('click', () => {
        window.location.href = 'post/createpost.html';
    });
    profileElement.appendChild(createPostButton);
  }

async function hideAuthorSelectionForm() {
    const authorSelectionForm = document.getElementById('author-select-form');
    if (authorSelectionForm) {
        authorSelectionForm.style.display = 'none';
    }
}

async function showAuthorSelectionForm() {
    const authorSelectionForm = document.getElementById('author-select-form');
    if (authorSelectionForm) {
        authorSelectionForm.style.display = 'block';
    }
}

async function onSelectAuthor(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const authorFree = formData.get('author-free');
    const authorSelected = formData.get('author');

    loadBlogPosts(authorFree || authorSelected);
}

  async function loadLoginRegisterLinks() {
    const loginRegisterLinks = document.getElementById('login-register-links-container');
    loginRegisterLinks.innerHTML = ''; // Clear the container before rendering the links
  
    const loginLink = document.createElement('a');
    loginLink.href = 'account/login.html';
    loginLink.textContent = 'Login';
  
    const registerLink = document.createElement('a');
    registerLink.href = 'account/register.html';
    registerLink.textContent = 'Register';
  
    loginRegisterLinks.appendChild(loginLink);
    loginRegisterLinks.appendChild(registerLink);
  }

  // Call the loadSinglePost function when the post/index.html page loads
  window.addEventListener('load', () => {
    setAuthListeners();
    const loggedInProfile = loadUserProfile();
    console.log('Logged in profile:', loggedInProfile);
    if (loggedInProfile) {
        hideAuthorSelectionForm();
        const blogPostsContainer = document.getElementById('blogPostsContainer');
        if (blogPostsContainer) {
            addCreatePostButton();
            loadBlogPosts(loggedInProfile.name);
        }
        if (window.location.pathname.includes('/post/')) {   
            loadSinglePost();
        }
    } else {
        showAuthorSelectionForm();
        loadLoginRegisterLinks()
    }
  });
  


