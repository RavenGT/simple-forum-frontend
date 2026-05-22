import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";
import { UserProvider } from "./UserContext";

function setup(onSuccess?: () => void) {
  return render(
    <MemoryRouter>
      <UserProvider>
        <LoginForm onSuccess={onSuccess} />
      </UserProvider>
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => localStorage.clear());

  it("logs in with a valid username", async () => {
    const onSuccess = vi.fn();
    setup(onSuccess);
    await userEvent.type(screen.getByLabelText(/username/i), "alice");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(localStorage.getItem("simple-forum:user-id")).toBe("alice");
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("shows an error message for an invalid username", async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/username/i), "bad name");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/2.{1,3}32 chars/i);
    expect(localStorage.getItem("simple-forum:user-id")).toBeNull();
  });
});
