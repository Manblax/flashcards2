import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteModule } from "@/lib/api";
import DeleteModuleButton from "./DeleteModuleButton";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

vi.mock("@/lib/api", () => ({
  deleteModule: vi.fn(),
}));

describe("DeleteModuleButton", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    vi.mocked(deleteModule).mockReset();
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    render(<DeleteModuleButton moduleId="module-1" />);

    await user.click(screen.getByRole("button", { name: /удалить/i }));

    expect(deleteModule).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("deletes the module and returns to the home page after confirmation", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(deleteModule).mockResolvedValue({});

    render(<DeleteModuleButton moduleId="module-1" />);

    await user.click(screen.getByRole("button", { name: /удалить/i }));

    await waitFor(() => {
      expect(deleteModule).toHaveBeenCalledWith("module-1");
      expect(push).toHaveBeenCalledWith("/");
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("shows an alert and re-enables the button when deletion fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.stubGlobal("alert", vi.fn());
    vi.mocked(deleteModule).mockRejectedValue(new Error("network"));

    render(<DeleteModuleButton moduleId="module-1" />);

    await user.click(screen.getByRole("button", { name: /удалить/i }));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("Не удалось удалить модуль");
      expect(screen.getByRole("button", { name: /удалить/i })).toBeEnabled();
    });
  });
});
