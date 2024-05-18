import { createPost } from "../api/register.mjs";

export function setCreatePostFormListener() {
    const form = document.querySelector("#createPost");
  
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const postData = Object.fromEntries(formData.entries());
  
        try {
          const name = '<danielamort12>'; // Replace with your registered username
          const newPost = await createPost(postData, name);
          console.log('New post created:', newPost.data);
          // You can redirect the user or show a success message here
        } catch (error) {
          console.error('An error occurred:', error);
          // Handle any network or other errors
        }
      });
    }
  }