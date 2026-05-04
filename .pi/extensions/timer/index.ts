import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

// Timer extension — adds a temporal dimension to bibo.
// Tracks session start, task-level marks, and elapsed time reporting.
// Provides three tools: TimeElapsed, MarkStart, MarkEnd.
// NOTE: Widget removed — was leaking into content stream.

interface TimerState {
  sessionStart: number;
  marks: Array<{ label: string; time: number }>;
  currentTask?: string;
  currentTaskStart?: number;
}

const state: TimerState = {
  sessionStart: Date.now(),
  marks: [],
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const rem = minutes % 60;
    return `${hours}h ${rem}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    const rem = seconds % 60;
    return `${minutes}m ${rem}s`;
  }
  return `${seconds}s`;
}

function elapsedSince(t: number): string {
  return formatDuration(Date.now() - t);
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    state.sessionStart = Date.now();
    state.marks = [];
    state.currentTask = undefined;
    state.currentTaskStart = undefined;
  });

  pi.on("session_shutdown", async () => {
    state.sessionStart = 0;
    state.marks = [];
    state.currentTask = undefined;
    state.currentTaskStart = undefined;
  });

  pi.registerTool({
    name: "TimeElapsed",
    label: "TimeElapsed",
    description:
      "Report how long you have been working. Shows session duration, " +
      "current task duration (if marked), and all task-level marks. " +
      "Accepts an optional label to report time since a specific mark.",
    parameters: Type.Object({
      label: Type.String({
        description: "Optional: a mark label to report time since. " +
          "If empty or omitted, reports full session + all marks.",
        default: "",
      }),
    }),
    async execute(_id, { label }) {
      const l = (label ?? "").trim();
      if (!l) {
        const lines: string[] = [];
        lines.push(`Session uptime: ${elapsedSince(state.sessionStart)}`);

        if (state.currentTask && state.currentTaskStart) {
          lines.push(`Current task '${state.currentTask}': ${elapsedSince(state.currentTaskStart)}`);
        }

        if (state.marks.length > 0) {
          lines.push("");
          lines.push("Task marks:");
          for (const m of state.marks) {
            lines.push(`  ${m.label}: ${elapsedSince(m.time)}`);
          }
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          details: {},
        };
      }

      // Report time since a specific mark
      const mark = state.marks.find((m) => m.label === l);
      if (!mark) {
        return {
          content: [{ type: "text", text: `No mark found for label '${l}'. Available marks: ${state.marks.map(m => m.label).join(", ") || "(none)"}` }],
          details: {},
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: `Time since '${l}': ${elapsedSince(mark.time)}` }],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: "MarkStart",
    label: "MarkStart",
    description:
      "Mark the start of a new task or phase. Records a timestamp " +
      "with the given label. Use to track time spent on distinct subtasks.",
    parameters: Type.Object({
      label: Type.String({
        description: "A short descriptive label for this task/phase. " +
          "e.g. 'reading-files', 'writing-test', 'debugging'",
      }),
    }),
    async execute(_id, { label }) {
      const l = (label ?? "").trim();
      if (!l) {
        return {
          content: [{ type: "text", text: "Error: label is required" }],
          details: {},
          isError: true,
        };
      }

      // If there's a current task, record its end time as a mark
      if (state.currentTask && state.currentTaskStart) {
        state.marks.push({
          label: state.currentTask,
          time: state.currentTaskStart,
        });
      }

      state.currentTask = l;
      state.currentTaskStart = Date.now();

      // Request widget re-render to show the new task
      return {
        content: [{ type: "text", text: `Started '${l}' at ${new Date().toISOString()}` }],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: "MarkEnd",
    label: "MarkEnd",
    description:
      "End the current task and report how long it took. " +
      "Also reports total session time.",
    parameters: Type.Object({}),
    async execute() {
      if (!state.currentTask || !state.currentTaskStart) {
        return {
          content: [{ type: "text", text: "No active task to end. Use MarkStart first." }],
          details: {},
          isError: true,
        };
      }

      const task = state.currentTask;
      const duration = formatDuration(Date.now() - state.currentTaskStart);
      const sessionDuration = formatDuration(Date.now() - state.sessionStart);

      state.marks.push({ label: task, time: state.currentTaskStart });
      state.currentTask = undefined;
      state.currentTaskStart = undefined;

      // Request widget re-render to clear the task display
      return {
        content: [{ type: "text", text: `Task '${task}' ended. Duration: ${duration}. Session total: ${sessionDuration}` }],
        details: {},
      };
    },
  });
}
