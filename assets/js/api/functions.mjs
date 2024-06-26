//constants for the API
const API_KEY = "cf7dc630-134f-4432-8cca-cc389127181";
const API_BASE = "https://v2.api.noroff.dev";
const API_AUTH = "/auth";
const API_REGISTER = "/register";
const API_LOGIN = "/login";
const API_POSTS_BASE = "/blog/posts";
const DEFAULT_PROFILE_NAME = 'rosarionew'

//helper functions
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key) {
  return JSON.parse(localStorage.getItem(key));
}

function registerEventListener(formId, callback) {
  const form = document.getElementById(formId);

  if (!form) {
      console.log(`Form with id ${formId} not found`);
      return;
  }

  form.addEventListener("submit", callback);
}

function convertFormToSearchParams(form) {
  const formData = new FormData(form);
  const searchParams = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (value) {
      searchParams.append(key, value);
    }
  }

  return searchParams;
}


//authentication functions

async function register(name, email, password) {
    const response = await fetch(API_BASE + API_AUTH + API_REGISTER, {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

    const body = await response.json();

    if (response.ok) {
        return body;
    }
    throw new Error("Could not register the account: " + body.errors.map((error) => error.message).join(", "));
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

    const body = await response.json();

    if (response.ok) {
        return body;
    }
    throw new Error("Could not login the account: " + body.errors.map((error) => error.message).join(", "));
}

async function onAuth(event) {
  document.getElementById("error-message").textContent = "";
  event.preventDefault();
    const name = event.target.name.value;
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      if (event.srcElement.id === "login-form") {
          await login(email, password);
      } else {
          await register(name, email, password);
          await login(email, password);
      }
      window.location.href = "/"; // Redirect to the home page
    } catch (error) {
      document.getElementById("error-message").textContent = error.message;
    }
}

function setAuthListeners() {
    registerEventListener("register-form", onAuth);
    registerEventListener("login-form", onAuth);
    registerEventListener("create-post-form", onCreatePost);
    registerEventListener("blogs-filter-form", onFilterBlogs);
    registerEventListener("edit-post-form", onUpdatePost);
}

async function onLogout(event) {
  event.preventDefault();
  localStorage.clear();
  console.log("logged out");
  // refresh the page
  window.location.reload();
} 

function displayUserProfile(profile) {
  const profileElement = document.getElementById('user-profile');

  if (profile) {
    profileElement.innerHTML = `
    <div class="profile-container">
        <div class="profile-info">Logged in as: ${profile.name}</div>
        <button id="logout" class="logout-btn">Logout</button>
      </div>
    `;
      const logoutButton = document.getElementById('logout');
      if (logoutButton) {
          logoutButton.addEventListener('click', onLogout);
      }
  }
}


// Blog Post Functions


async function getPosts(profileName, params) {
   if (!profileName) {
    throw new Error("ProfileName missing.");
   }
  let uri = `${API_BASE}${API_POSTS_BASE}/${profileName}`;
  if (params && params.size > 0) {
    uri = `${uri}?${params}`;
  }
  const response = await fetch(uri, {
     headers: {
        Authorization: `Bearer ${load("token")}`,
        "X-Noroff-API-Key": API_KEY,
    }
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
    return newPost.data;
}

async function onCreatePost(event) {
  document.getElementById("error-message").textContent = '';

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
      const createdPost = await createPost(postData);
      const newPostId = createdPost.id;
      const postAuthor = createdPost.author.name
      console.log('New post created with ID:', newPostId);

      // Redirect to the single post page
      window.location.href = `/post/index.html?id=${newPostId}&author=${postAuthor}`;
  } catch (error) {
    document.getElementById("error-message").textContent = error.message;
  }
}

async function fetchBlogPosts(profileName, params) {
  document.getElementById("error-message").textContent = '';
  try {
      const posts = await getPosts(profileName, params);
      return posts;
    } catch (error) {
      document.getElementById("error-message").textContent = error.message;
      console.error('Error fetching blog posts:', error);
      return {data: []};
    }
}

function renderBlogPostsNavigation(meta) {
  renderBlogPostsNavigationForDiv(meta, 'blogPostsNavigationBelow');
  renderBlogPostsNavigationForDiv(meta, 'blogPostsNavigationAbove');
}

function renderBlogPostsNavigationForDiv(meta, divId) {
 
  const blogPostsNavigation = document.getElementById(divId);
  if (!blogPostsNavigation) return;

  blogPostsNavigation.innerHTML = ''; // Clear the container before rendering the navigation

  function createPageButton(textContent, pageNumber, enabled) {
    const button = document.createElement('button');
    button.textContent = textContent;
    if (enabled) {
      button.addEventListener('click', () => {
        document.getElementById('filter-page').value = pageNumber;
        onFilterBlogs(new Event('submit'));
      });
    } else {
      button.disabled = true;
    }
    return button;
  }

  const firstButton = createPageButton('First', 1, meta.currentPage > 1);
  const prevButton = createPageButton('Previous', meta.previousPage, meta.currentPage > 1);
  const nextButton = createPageButton('Next', meta.nextPage, meta.currentPage < meta.pageCount);
  const lastButton = createPageButton('Last', meta.pageCount, meta.currentPage < meta.pageCount);
  
  blogPostsNavigation.appendChild(firstButton);
  blogPostsNavigation.appendChild(prevButton);
  blogPostsNavigation.appendChild(document.createTextNode(`Page ${meta.currentPage} of ${meta.pageCount}`));
  blogPostsNavigation.appendChild(nextButton);
  blogPostsNavigation.appendChild(lastButton);
} 

function renderBlogPosts(posts) {
  const blogPostsContainer = document.getElementById('blogPostsContainer');
  blogPostsContainer.innerHTML = ''; // Clear the container before rendering new posts

  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.classList.add('blog-post');

    const postLink = document.createElement('a');
    postLink.href = `post/index.html?id=${post.id}&author=${post.author.name}`;

    const imageElement = document.createElement('img');
    if (post.media && post.media.url) {
      imageElement.src = post.media.url;
    } else {
      imageElement.src = 'https://via.placeholder.com/300';
    }
    imageElement.alt = post.title;
    postLink.appendChild(imageElement);

    const contentElement = document.createElement('div');
    contentElement.classList.add('blog-post-content');

    const titleElement = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = `post/index.html?id=${post.id}&author=${post.author.name}`;
    titleLink.textContent = post.title;
    titleElement.appendChild(titleLink);
    contentElement.appendChild(titleElement);

    postElement.appendChild(postLink);
    postElement.appendChild(contentElement);
    blogPostsContainer.appendChild(postElement);
  });
}

async function onFilterBlogs(event) {
  event.preventDefault();
  const profile = load('profile');
  let authorName = DEFAULT_PROFILE_NAME;
  if (profile) {
    authorName = profile.name;
  }
  loadBlogPosts(authorName);
}

async function loadBlogPosts(profileName) {
  const searchBlogParams = convertFormToSearchParams(document.getElementById('blogs-filter-form'));
  const response = await fetchBlogPosts(profileName, searchBlogParams);
  const posts = response.data;
  renderBlogPostsNavigation(response.meta);
  renderBlogPosts(posts);
  renderCarouselPosts(posts.slice(0, 3)); // Pass the three latest posts to renderCarouselPost
}

function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

function getPostAuthorNameFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('author');
}

async function fetchSinglePost(postAuthor, postId) {
  try {
    const response = await fetch(`${API_BASE}${API_POSTS_BASE}/${postAuthor}/${postId}`, {
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
    // TODO handle error better
    console.error('Error fetching post:', error);
    return null;
  }
}

async function updatePost(postAuthor, postId, updatedPost) {
  const profile = load("profile");
  if (!profile) {
    throw new Error("Profile not found. Please log in.");
  }
  if (!postAuthor == profile.name) {
    throw new Error("You are not authorized to delete this post.");
  }

  const response = await fetch(`${API_BASE}${API_POSTS_BASE}/${postAuthor}/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${load('token')}`,
      'X-Noroff-API-Key': API_KEY,
    },
    body: JSON.stringify(updatedPost),
  });

  if (!response.ok) {
    throw new Error('Failed to update post');
  }
 
  return await response.json();
}


function renderSinglePost(post) {
  const singlePostContainer = document.getElementById('singlePostContainer');
  if (!singlePostContainer) return;
  singlePostContainer.innerHTML = ''; // Clear the container before rendering the post

  const titleElement = document.createElement('h1');
  titleElement.textContent = post.title;

  const bodyElement = document.createElement('p');
  bodyElement.textContent = post.body;

  const imageElement = document.createElement('img');
  if (post.media && post.media.url) {
    imageElement.src = post.media.url;
    imageElement.alt = post.media.alt;
  } else {
    imageElement.src = 'https://via.placeholder.com/300';
    imageElement.alt = 'Placeholder image';
  }

  const authorElement = document.createElement('p');
  authorElement.textContent = `Author: ${post.author.name}`;

  const publishDateElement = document.createElement('p');
  publishDateElement.textContent = `Published: ${new Date(post.created).toLocaleString()}`;
   // Create a new element to display the tags
   const tagsElement = document.createElement('p');
   tagsElement.textContent = 'Tags: ';
 
   // Loop through the tags array and create a span for each tag
   post.tags.forEach(tag => {
     const tagSpan = document.createElement('span');
     tagSpan.textContent = tag;
     tagSpan.classList.add('tag');
     tagsElement.appendChild(tagSpan);
   });

  const deleteButtonContainer = document.createElement('div');
  deleteButtonContainer.classList.add('delete-button-container');

  const deleteButton = document.createElement('button');

  const profile = load("profile");
  if (profile && profile.name === post.author.name) {
    deleteButton.textContent = 'Delete Post';
    deleteButton.addEventListener('click', () => {
      onDeletePost(post);
    });
    deleteButtonContainer.appendChild(deleteButton);
    singlePostContainer.appendChild(deleteButtonContainer);
  
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit Post';
    editButton.classList.add('edit-button-container'); // Add a class to style the button
    editButton.addEventListener('click', () => {
      window.location.href = `/post/edit.html?id=${post.id}&author=${post.author.name}`;
    });
    singlePostContainer.appendChild(editButton);
  }

  singlePostContainer.parentNode.insertBefore(deleteButtonContainer, singlePostContainer.nextSibling);

  singlePostContainer.appendChild(titleElement);
  singlePostContainer.appendChild(authorElement);
  singlePostContainer.appendChild(publishDateElement);
  singlePostContainer.appendChild(tagsElement); 
  singlePostContainer.appendChild(imageElement);
  singlePostContainer.appendChild(bodyElement);
}
  
async function onDeletePost(post) {
  const postId = post.id;
  const postAuthor = post.author.name;
  try {
    document.getElementById("error-message").textContent = "";

    const profile = load("profile");
    if (!profile) {
      throw new Error("Profile not found. Please log in.");
    }
    if (!postAuthor == profile.name) {
      throw new Error("You are not authorized to delete this post.");
    }

    const post = await fetchSinglePost(postAuthor, postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) {
      return; // Cancel deletion if the user doesn't confirm
    }

    const response = await fetch(`${API_BASE}${API_POSTS_BASE}/${postAuthor}/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${load('token')}`,
        'X-Noroff-API-Key': API_KEY,
      },
    });

    if (response.ok) {
      console.log('Post deleted successfully');
      // Redirect to the appropriate page after successful deletion
      window.location.href = '/index.html';
    } else {
      throw new Error(`Failed to delete post: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    document.getElementById("error-message").textContent = error.message;
  }
}
async function onUpdatePost(event) {
  document.getElementById("error-message").textContent = '';

  event.preventDefault();
  const postId = getPostIdFromUrl();
  const postAuthor = getPostAuthorNameFromUrl();
  if (postId && postAuthor) {
    const formData = new FormData(event.target);
    const updatedPost = Object.fromEntries(formData.entries());
    updatedPost.tags = updatedPost.tags.split(',').map(tag => tag.trim());
    updatedPost.media = {
      url: updatedPost.mediaUrl,
      alt: updatedPost.mediaAlt,
    };
    delete updatedPost.mediaUrl;
    delete updatedPost.mediaAlt;

    try {
      const updatedPostData = await updatePost(postAuthor, postId, updatedPost);
      console.log('Updated post:', updatedPostData);
      const post = updatedPostData.data;
      window.location.href = `/post/index.html?id=${postId}&author=${post.author.name}`;
    } catch (error) {
      document.getElementById("error-message").textContent = error.message;
    }
  }
}

async function populateEditForm() {
  const postId = getPostIdFromUrl();
  const postAuthor = getPostAuthorNameFromUrl();
  if (postId) {
    const post = await fetchSinglePost(postAuthor, postId);
    if (post) {
      document.getElementById('title').value = post.data.title;
      document.getElementById('body').value = post.data.body;
      if (post.data.tags) {
        document.getElementById('tags').value = post.data.tags.join(', ');
      }
      if (post.data.media && post.data.media.url) {
        document.getElementById('mediaUrl').value = post.data.media.url;
        document.getElementById('mediaAlt').value = post.data.media.alt || '';
      }
    }
  }
}

async function loadSinglePost() {
  const postId = getPostIdFromUrl();
  const postAuthor = getPostAuthorNameFromUrl();
  if (postId) {
    const post = await fetchSinglePost(postAuthor, postId);
    if (post) {
      // console.log('Post data:', post.data);
      renderSinglePost(post.data);
    } else {
      console.error('Post not found');
    }
  }
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

// Carousel Functions
function setupCarousel() {
  const buttons = document.querySelectorAll("[data-carousel-button]");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const offset = button.dataset.carouselButton === "next" ? 1 : -1;
      const slides = button.closest("[data-carousel]").querySelector("[data-slides]");
      const activeSlide = slides.querySelector("[data-active]");
      const indicators = button.closest("[data-carousel]").querySelectorAll(".carousel-indicator");
      let newIndex = [...slides.children].indexOf(activeSlide) + offset;
      
      if (newIndex < 0) {
        newIndex = slides.children.length - 1;
      } else if (newIndex >= slides.children.length) {
        newIndex = 0;
      }

      // Remove active attribute from the previous slide and indicator
      delete activeSlide.dataset.active;
      indicators.forEach(indicator => indicator.classList.remove("active"));

      // Set active attribute to the new slide and indicator
      slides.children[newIndex].dataset.active = true;
      indicators[newIndex].classList.add("active");
    });
  });
}

function renderCarouselPosts(posts) {
  const carouselSlides = document.querySelector("[data-slides]");
  const carouselIndicators = document.querySelector("[data-carousel-indicators]");
  carouselSlides.innerHTML = ""; // Clear the carousel slides
  carouselIndicators.innerHTML = ""; // Clear the carousel indicators

  posts.forEach((post, index) => {
    const slideElement = document.createElement("li");
    slideElement.classList.add("slide");
    if (index === 0) {
      slideElement.dataset.active = true; // Set the first slide as active
    }

    const postLink = document.createElement("a");
    postLink.href = `/post/index.html?id=${post.id}&author=${post.author.name}`; // Use the unique post ID

    const imageElement = document.createElement("img");
    if (post.media && post.media.url) {
      imageElement.src = post.media.url;
    } else {
      imageElement.src = "https://via.placeholder.com/300";
    }
    imageElement.alt = post.title;
    postLink.appendChild(imageElement);

    slideElement.appendChild(postLink);
    carouselSlides.appendChild(slideElement);

    // Create indicators
    const indicatorElement = document.createElement("button");
    indicatorElement.classList.add("carousel-indicator");
    if (index === 0) {
      indicatorElement.classList.add("active");
    }
    indicatorElement.addEventListener("click", () => {
      carouselSlides.querySelector("[data-active]").removeAttribute("data-active");
      slideElement.dataset.active = true;
      carouselIndicators.querySelectorAll(".active").forEach(indicator => {
        indicator.classList.remove("active");
      });
      indicatorElement.classList.add("active");
    });
    carouselIndicators.appendChild(indicatorElement);
  });
}

// Login/Register Links Functions

async function loadLoginRegisterLinks() {
  const loginRegisterLinks = document.getElementById('login-register-links-container');
  if (!loginRegisterLinks) return;
  loginRegisterLinks.innerHTML = ''; // Clear the container before rendering the links

  const loginLink = document.createElement('a');
  loginLink.href = '/account/login.html';
  loginLink.textContent = 'Login';

  const registerLink = document.createElement('a');
  registerLink.href = '/account/register.html';
  registerLink.textContent = 'Register';
 
  loginRegisterLinks.innerHTML = `
  <h2>Admin Portal</h2>
  <div class="footer-links">
  </div>
  `;

  loginRegisterLinks.appendChild(loginLink);
  loginRegisterLinks.appendChild(registerLink);
}

function onPageLoad() {
  const profileToLoad = DEFAULT_PROFILE_NAME;
  setAuthListeners();

  // path == /index.html or /
  const blogPostsContainer = document.getElementById('blogPostsContainer');
  if (blogPostsContainer) {
    setupCarousel();
    const loggedInProfile = load('profile');
    displayUserProfile(loggedInProfile);
    console.log('Logged in profile:', loggedInProfile);
    if (loggedInProfile) {
      addCreatePostButton();
      loadBlogPosts(loggedInProfile.name);
    } else {
      loadBlogPosts(profileToLoad);
      loadLoginRegisterLinks();
    }
  } else {
    if (window.location.pathname.includes('/post/edit.html')) {
      populateEditForm();
    } else if (window.location.pathname.includes('/post/index.html')) {   
      loadSinglePost();
    }
  }
}

// Event Listeners
window.addEventListener('load', onPageLoad);
