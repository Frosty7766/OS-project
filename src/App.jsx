import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

import "./App.css";

const algorithms = [
  {
    name: "First Come First Serve",
    quantum: false,
    implement: firstCfs,
    priority: false,
  },
  {
    name: "Round-Robin",
    quantum: true,
    implement: roundRobin,
    priority: false,
  },
  {
    name: "Shortest Job First (SJF) Preemptive",
    quantum: false,
    implement: shortestJFP,
    priority: false,
  },
  {
    name: "Shortest Job First (SJF) Non-Preemptive",
    quantum: false,
    implement: shortestJFNP,
    priority: false,
  },
  {
    name: "Priority - Preemptive",
    quantum: false,
    implement: priorityPreemptive,
    priority: true,
  },
  {
    name: "Priority - Non-Preemptive",
    quantum: false,
    implement: priorityNonPreemptive,
    priority: true,
  },
];

function firstCfs(processes) {
  processes.sort((p1, p2) => p1.arrivalTime - p2.arrivalTime);
  let currentTime = 0;
  const gantt = [];
  for (let i = 0; i < processes.length; i++) {
    currentTime +=
      Math.max(processes[i].arrivalTime - currentTime, 0) +
      processes[i].burstTime;
    processes[i].completedTime = currentTime;
    processes[i].turnAround = currentTime - processes[i].arrivalTime;
    processes[i].waitTime = processes[i].turnAround - processes[i].burstTime;
    gantt.push({ id: processes[i].processId, time: currentTime });
  }
  return [processes, gantt];
}

function roundRobin(processes, quantum) {
  if (processes.length === 0) return;
  const stack = processes
    .toSorted((p1, p2) => p1.arrivalTime - p2.arrivalTime)
    .map((e) => {
      e.remainingBurstTime = e.burstTime;
      return e;
    });
  let currentTime = stack[0].arrivalTime;
  const readyQueue = [stack.shift()];
  const gantt = [];
  while (stack.length !== 0) {
    while (readyQueue.length !== 0) {
      const e = readyQueue.shift();
      if (e.remainingBurstTime <= quantum) {
        currentTime += e.remainingBurstTime;
        e.completedTime = currentTime;
        e.turnAround = e.completedTime - e.arrivalTime;
        e.waitTime = e.turnAround - e.burstTime;
      } else {
        currentTime += quantum;
      }
      gantt.push({ id: e.processId, time: currentTime });
      while (stack.length !== 0 && stack[0].arrivalTime <= currentTime) {
        readyQueue.push(stack.shift());
      }

      e.remainingBurstTime -= quantum;
      if (e.remainingBurstTime > 0) {
        readyQueue.push(e);
      }
    }
    if (stack.length > 0)
      if (stack[0].arrivalTime <= currentTime) {
        readyQueue.push(stack.shift());
      } else {
        currentTime += 1;

        gantt.push({ id: -1, time: currentTime });
      }
  }
  console.log(processes);
  return [processes, gantt];
}

function shortestJFP(processes) {
  const gantt = [];
  processes = processes.map((e) => {
    e.remainingBurstTime = e.burstTime;
    return e;
  });
  processes.sort((p1, p2) => p1.remainingBurstTime - p2.remainingBurstTime);
  let copy = [...processes];
  let currentTime = 0;

  while (processes.length !== 0) {
    let found = false;
    for (let i = 0; i < processes.length; i++) {
      currentTime += 1;
      if (processes[i].arrivalTime < currentTime) {
        processes[i].remainingBurstTime -= 1;
        if (processes[i].remainingBurstTime === 0) {
          processes[i].completedTime = currentTime;
          processes[i].turnAround = currentTime - processes[i].arrivalTime;
          processes[i].waitTime =
            processes[i].turnAround - processes[i].burstTime;

          gantt.push({
            id: processes[i].processId,
            time: currentTime,
          });

          processes.splice(i, 1);
          found = true;
        } else {
          processes.sort(
            (p1, p2) => p1.remainingBurstTime - p2.remainingBurstTime
          );
        }
        break;
      }
    }
    if (!found) {
      gantt.push({ id: -1, time: currentTime });
    }
  }
  return [copy, gantt];
}

function shortestJFNP(processes) {
  processes.sort((p1, p2) => p1.burstTime - p2.burstTime);
  let copy = [...processes];
  let currentTime = 0;
  const gantt = [];
  while (processes.length !== 0) {
    let found = false;
    for (let i = 0; i < processes.length; i++) {
      if (processes[i].arrivalTime <= currentTime) {
        currentTime += processes[i].burstTime;
        processes[i].completedTime = currentTime;
        processes[i].turnAround = currentTime - processes[i].arrivalTime;
        processes[i].waitTime =
          processes[i].turnAround - processes[i].burstTime;
        gantt.push({ id: processes[i].processId, time: currentTime });
        processes.splice(i, 1);
        found = true;
        break;
      }
    }
    if (!found) {
      currentTime += 1;
      gantt.push({ id: -1, time: currentTime });
    }
  }
  return [copy, gantt];
}

function priorityPreemptive(processes) {
  processes.forEach((process) => (process.remainingTime = process.burstTime));

  const completedProcesses = [];
  let currentTime = 0;

  const gantt = [];
  while (processes.length > 0) {
    const availableProcesses = processes.filter(
      (process) => process.arrivalTime <= currentTime
    );

    if (availableProcesses.length === 0) {
      gantt.push({ id: -1, time: currentTime });
      currentTime++;
      continue;
    }

    const nextProcess = availableProcesses.reduce((prev, current) =>
      current.priority > prev.priority ? current : prev
    );

    currentTime++;
    gantt.push({ id: nextProcess.processId, time: currentTime });
    nextProcess.remainingTime--;

    if (nextProcess.remainingTime === 0) {
      nextProcess.completionTime = currentTime;
      nextProcess.turnAround = currentTime - nextProcess.arrivalTime;
      nextProcess.waitTime = nextProcess.turnAround - nextProcess.burstTime;
      completedProcesses.push(
        processes.splice(processes.indexOf(nextProcess), 1)[0]
      );
    }
  }

  processes = completedProcesses;
  return [processes, gantt];
}

function priorityNonPreemptive(processes) {
  processes.sort((p1, p2) => p2.priority - p1.priority);
  let copy = [...processes];
  let currentTime = 0;
  const gantt = [];
  while (processes.length !== 0) {
    let found = false;
    for (let i = 0; i < processes.length; i++) {
      if (processes[i].arrivalTime <= currentTime) {
        currentTime += processes[i].burstTime;
        processes[i].completedTime = currentTime;
        processes[i].turnAround = currentTime - processes[i].arrivalTime;
        processes[i].waitTime =
          processes[i].turnAround - processes[i].burstTime;
        gantt.push({
          id: processes[i].processId,
          time: currentTime,
        });
        processes.splice(i, 1);
        found = true;
        break;
      }
    }
    if (!found) {
      currentTime += 1;

      gantt.push({ id: -1, time: currentTime });
    }
  }
  return [copy, gantt];
}

function App() {
  const [processes, setProcesses] = useState([]);
  const [processId, setProcessId] = useState();
  const [arrivalTime, setArrivalTime] = useState();
  const [burstTime, setBurstTime] = useState();
  const [priority, setPriority] = useState();
  const [quantum, setQuantum] = useState("");
  const [results, setResults] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const { theme, setTheme } = useTheme();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(0);
  const thClasses = "border p-4 ";
  const tdClasses = "border p-1 text-center";
  const buttonClasses = "bg-primary rounded-xs hover:bg-primary/90";
  const inputClasses = "rounded-xs p-1 h-fit text-black";
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <header className="text-center border-b flex justify-center items-center gap-32">
        <h1 className="text-4xl">CPU Scheduler</h1>
        <button
          onClick={() => {
            if (theme === "light") setTheme("dark");
            else setTheme("light");
          }}
        >
          {theme === "light" ? (
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          ) : (
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          )}
        </button>
      </header>

      <div className="flex flex-col items-center gap-8 pt-4 ">
        <div className="flex gap-4">
          <div className="border border-border rounded-sm overflow-hidden">
            <table className="h-full">
              <tr>
                <th className={thClasses}>Process ID</th>
                <th className={thClasses}>Arrival Time</th>
                <th className={thClasses}>Burst Time</th>
                {algorithms[selectedAlgorithm].priority && (
                  <th className={thClasses}>Priority</th>
                )}
              </tr>
              {processes.map(
                ({ processId, arrivalTime, burstTime, priority }) => (
                  <tr key={processId}>
                    <td className={tdClasses}>{processId}</td>
                    <td className={tdClasses}>{arrivalTime}</td>
                    <td className={tdClasses}>{burstTime}</td>
                    {algorithms[selectedAlgorithm].priority && (
                      <td className={tdClasses}>{priority}</td>
                    )}
                  </tr>
                )
              )}
            </table>
          </div>
          <div className="flex flex-col gap-4 p-4 border rounded-sm">
            <select
              className="text-black rounded-xs p-1"
              onChange={(e) => {
                setProcesses([]);
                setResults([]);
                setBreaks([]);
                setSelectedAlgorithm(e.target.value);
              }}
            >
              {algorithms.map((algorithm, index) => (
                <option value={index}>{algorithm.name}</option>
              ))}
            </select>
            {algorithms[selectedAlgorithm].quantum && (
              <input
                value={quantum}
                onChange={(e) => {
                  const newInput = Number(e.target.value);
                  if (newInput && newInput > 0) setQuantum(newInput);
                  else setQuantum(0);
                }}
                className={inputClasses}
                placeholder="Time Quantum"
                type="number"
                min={"0"}
              ></input>
            )}
            <button
              className={buttonClasses + " p-1"}
              onClick={() => {
                if (processes.length === 0) {
                  return;
                }
                const [results, breaks] = algorithms[
                  selectedAlgorithm
                ].implement(JSON.parse(JSON.stringify(processes)), quantum);
                console.log(breaks);
                setResults(results);
                setBreaks(breaks);
              }}
            >
              Calculate
            </button>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <input
            className={inputClasses}
            value={processId}
            onChange={(e) => {
              const newInput = Number(e.target.value);
              if (newInput && newInput > 0) setProcessId(newInput);
              else setProcessId(0);
            }}
            placeholder="Process ID"
            type="number"
            min={"0"}
          />
          <input
            className={inputClasses}
            value={arrivalTime}
            onChange={(e) => {
              const newInput = Number(e.target.value);
              if (newInput && newInput > 0) setArrivalTime(newInput);
              else setArrivalTime(0);
            }}
            placeholder="Arrival Time"
            type="number"
            min={"0"}
          />
          <input
            className={inputClasses}
            value={burstTime}
            onChange={(e) => {
              const newInput = Number(e.target.value);
              if (newInput && newInput > 0) setBurstTime(newInput);
              else setBurstTime(0);
            }}
            placeholder="Burst Time"
            type="number"
            min={"0"}
          />
          {algorithms[selectedAlgorithm].priority && (
            <input
              className={inputClasses}
              value={priority}
              onChange={(e) => {
                const newInput = Number(e.target.value);
                if (newInput && newInput > 0) setPriority(newInput);
                else setPriority(0);
              }}
              placeholder="Priority"
              type="number"
              min={"0"}
            ></input>
          )}

          <button
            className={buttonClasses + " p-2"}
            onClick={() => {
              if (
                processId === undefined ||
                arrivalTime === undefined ||
                burstTime === undefined ||
                (algorithms[selectedAlgorithm].priority &&
                  priority === undefined)
              ) {
                return;
              }
              setProcesses((prev) => [
                ...prev,
                { processId, arrivalTime, burstTime, priority },
              ]);
            }}
          >
            Add Process
          </button>
        </div>
        <div>
          <table className="h-full">
            <tr>
              <th className={thClasses}>Process ID</th>
              <th className={thClasses}>Arrival Time</th>
              <th className={thClasses}>Burst Time</th>
              <th className={thClasses}>Finish Time</th>
              <th className={thClasses}>Turnaround Time</th>
              <th className={thClasses}>Waiting Time</th>
            </tr>
            {results.map(
              ({
                processId,
                arrivalTime,
                burstTime,
                completedTime,
                turnAround,
                waitTime,
              }) => {
                return (
                  <tr key={processId}>
                    <td className={tdClasses}>{processId}</td>
                    <td className={tdClasses}>{arrivalTime}</td>
                    <td className={tdClasses}>{burstTime}</td>
                    <td className={thClasses}>{completedTime}</td>
                    <td className={thClasses}>{turnAround}</td>
                    <td className={thClasses}>{waitTime}</td>
                  </tr>
                );
              }
            )}
          </table>
          <table className="h-full">
            <tr>
              <td className={tdClasses}>ID</td>
              {breaks.map(({ id, time }) => (
                <td className={tdClasses} key={time}>
                  {" "}
                  {id === -1 ? "IDLE" : id}
                </td>
              ))}
            </tr>
            <tr>
              <td className={tdClasses}>Time</td>
              {breaks.map(({ time }) => (
                <td className={tdClasses} key={time}>
                  {time}{" "}
                </td>
              ))}
            </tr>
          </table>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
