import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportForm } from "./report-form";

describe("ReportForm Lite mode", () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
  afterEach(() => vi.useRealTimers());

  it("restores and persists a local draft without a network request", () => {
    localStorage.setItem("nivaran-lite-draft", JSON.stringify({ description: "Blocked drain near Azad Market", location: "Ward 3", language: "hi" }));
    render(<ReportForm lite />);
    act(() => vi.advanceTimersByTime(1));
    const report = screen.getByLabelText("What happened?");
    expect(report).toHaveValue("Blocked drain near Azad Market");
    fireEvent.change(report, { target: { value: "Blocked drain near Azad Market gate" } });
    act(() => vi.advanceTimersByTime(500));
    expect(JSON.parse(localStorage.getItem("nivaran-lite-draft") ?? "{}").description).toBe("Blocked drain near Azad Market gate");
  });
});
