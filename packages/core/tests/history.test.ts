import { describe, expect, it } from "vitest";

import { canRedo, canUndo, createHistory, executeHistory, redoHistory, undoHistory } from "../src";

describe("history", () => {
  it("undoes and redoes state transitions", () => {
    let history = createHistory(0);
    history = executeHistory(history, 1);
    history = executeHistory(history, 2);
    expect(canUndo(history)).toBe(true);

    history = undoHistory(history);
    expect(history.present).toBe(1);
    expect(canRedo(history)).toBe(true);

    history = redoHistory(history);
    expect(history.present).toBe(2);
  });

  it("clears redo states after a new edit", () => {
    let history = executeHistory(createHistory(0), 1);
    history = undoHistory(history);
    history = executeHistory(history, 5);
    expect(canRedo(history)).toBe(false);
  });
});
