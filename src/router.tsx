import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/layout/AppShell";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ForumsPage from "@/pages/ForumsPage";
import ForumPage from "@/pages/ForumPage";
import PostPage from "@/pages/PostPage";
import CreateForumPage from "@/pages/CreateForumPage";
import CreatePostPage from "@/pages/CreatePostPage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/forums", element: <ForumsPage /> },
      { path: "/forums/new", element: <CreateForumPage /> },
      { path: "/submit", element: <CreatePostPage /> },
      { path: "/r/:forumName", element: <ForumPage /> },
      { path: "/r/:forumName/p/:postId", element: <PostPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
