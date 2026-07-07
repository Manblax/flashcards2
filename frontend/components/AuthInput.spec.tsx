import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import AuthInput from "./AuthInput";

describe("AuthInput", () => {
  it("renders an accessible labeled input", async () => {
    const user = userEvent.setup();

    render(
      <AuthInput
        id="email"
        label="Email"
        name="email"
        placeholder="you@example.com"
      />,
    );

    const input = screen.getByLabelText("Email");

    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("placeholder", "you@example.com");

    await user.type(input, "demo@example.com");

    expect(input).toHaveValue("demo@example.com");
  });

  it("merges custom class names", () => {
    render(<AuthInput id="password" label="Password" className="is-invalid" />);

    expect(screen.getByLabelText("Password")).toHaveClass("is-invalid");
  });
});
