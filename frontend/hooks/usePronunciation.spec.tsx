import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { PronunciationSession } from "@/lib/pronunciation";
import { usePronunciation } from "./usePronunciation";

beforeEach(() => {
  vi.spyOn(PronunciationSession.prototype, "dispose").mockImplementation(
    () => {},
  );
});

it("shows autoplay guidance and allows replay", async () => {
  const play = vi
    .spyOn(PronunciationSession.prototype, "play")
    .mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"))
    .mockResolvedValue("uk");
  const { result } = renderHook(() =>
    usePronunciation("apple", { autoPlay: true }),
  );
  await waitFor(() => expect(result.current.status).toBe("error"));
  expect(result.current.message).toContain("Нажмите на динамик");
  act(() => result.current.replay());
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(play).toHaveBeenCalledTimes(2);
});

it("ignores late results after moving to a new prompt", async () => {
  let resolve!: (variant: "us") => void;
  vi.spyOn(PronunciationSession.prototype, "play").mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const { result, rerender } = renderHook(
    ({ text }) => usePronunciation(text),
    { initialProps: { text: "apple" } },
  );
  act(() => result.current.play());
  rerender({ text: "pear" });
  await act(async () => {
    resolve("us");
  });
  expect(result.current.status).toBe("idle");
  expect(result.current.message).toBeNull();
  expect(PronunciationSession.prototype.dispose).toHaveBeenCalled();
});
