"use client";
import React, { useState, useEffect, useRef, createContext, useContext } from "react";

/**
 * MathMaster Pro Content Module
 * 
 * This file contains all main UI components, helpers, and hooks for the MathMaster Pro app.
 * It is heavily documented for maintainability, extensibility, and onboarding of new contributors.
 * 
 * Features:
 * - Equation input (text/image)
 * - Math topic detection and solution streaming
 * - Practice problems and alternative methods generation
 * - Solution history, saved solutions, and notes
 * - Accessibility and i18n hooks (demo)
 * - Extensive error handling and UI feedback
 * - Theming and animation extension points
 * 
 * Contributors: Please see CONTRIBUTING.md for guidelines.
 */

/* =======================
   Utility Functions
   ======================= */

/**
 * Cleans up math expressions by removing LaTeX/Markdown syntax.
 * @param {string} str - The raw math string.
 * @returns {string} - The cleaned-up string.
 * 
 * Example:
 *   cleanEquation('\\frac{a}{b}') // "fracab"
 */
function cleanEquation(str) {
  return str.replace(/\\/g, "").replace(/\{|\}/g, "").replace(/\$/g, "");
}

/**
 * Detects the mathematical topic from a string.
 * @param {string} input - User input.
 * @returns {string} - Topic name.
 */
function detectMathTopic(input) {
  if (input.includes("=")) return "Algebra";
  if (input.match(/\b(sin|cos|tan)\b/)) return "Trigonometry";
  if (input.includes("∫") || input.includes("d/dx")) return "Calculus";
  if (input.includes("√")) return "Roots";
  if (input.includes("%")) return "Percentages";
  if (input.includes("matrix") || input.includes("[")) return "Matrices";
  return "General Mathematics";
}

/**
 * Formats a number to a specific number of decimals.
 * @param {number|string} num 
 * @param {number} decimals 
 * @returns {string}
 */
function formatNumber(num, decimals = 2) {
  let n = typeof num === "number" ? num : parseFloat(num);
  if (isNaN(n)) return num;
  return n.toFixed(decimals);
}

/**
 * Generates a random math tip for motivation.
 * @returns {string}
 */
function getRandomMathTip() {
  const tips = [
    "Break big problems into smaller steps.",
    "Draw diagrams for better visualization.",
    "Double-check your calculations for accuracy.",
    "Practice regularly to improve your skills.",
    "Ask for help if you're stuck!",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

/* =======================
   Context & Theming
   ======================= */

/**
 * Theme context for dark/light mode switching (demo).
 */
const ThemeContext = createContext("light");

/**
 * Internationalization context placeholder for future i18n/locale support.
 */
const I18nContext = createContext({
  locale: "en",
  t: (str) => str, // Identity translation function by default
});

/**
 * Custom hook for theme access.
 */
function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Custom hook for translation access.
 */
function useI18n() {
  return useContext(I18nContext);
}

/* =======================
   Demo/Showcase Components
   ======================= */

/**
 * Demo: Animated Banner with accessibility and i18n hooks.
 */
function AnimatedBanner() {
  const { t } = useI18n();
  const theme = useTheme();
  return (
    <header
      className={`py-6 mb-6 rounded-xl shadow text-center ${
        theme === "dark"
          ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white"
          : "bg-gradient-to-r from-blue-100 to-purple-100 text-gray-900"
      } animate-bounce-soft`}
      aria-label={t("Welcome to MathMaster Pro")}
    >
      <h1 className="text-5xl font-extrabold mb-2 tracking-tight animate-pop">
        {t("MathMaster Pro")}
      </h1>
      <p className="text-lg animate-wave">
        {t("Your Advanced Mathematical Problem Solver")}
      </p>
      <p className="mt-2 text-sm text-purple-600" aria-live="polite">
        {t(getRandomMathTip())}
      </p>
    </header>
  );
}

/**
 * Demo: Loading Indicator with ARIA support.
 */
function LoadingIndicator({ loading, children = "Loading..." }) {
  if (!loading) return null;
  return (
    <div
      className="flex items-center space-x-2 text-blue-700 animate-pulse"
      role="status"
      aria-live="polite"
    >
      <i className="fas fa-spinner fa-spin"></i>
      <span>{children}</span>
    </div>
  );
}

/* =======================
   Main App Components
   ======================= */

/**
 * Practice Problems Component
 * @param {object} props
 * @param {Array} props.problems - Array of practice problem objects.
 */
function PracticeProblems({ problems }) {
  const [openIdx, setOpenIdx] = useState(null);

  // Accessibility: focus on the solution when revealed
  const solutionRefs = useRef([]);

  useEffect(() => {
    if (openIdx !== null && solutionRefs.current[openIdx]) {
      solutionRefs.current[openIdx].focus();
    }
  }, [openIdx]);

  return (
    <div className="space-y-6">
      {problems.map((problem, idx) => (
        <div
          key={idx}
          className="border-b border-gray-100 pb-6 last:border-0"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">Problem {idx + 1}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                problem.difficulty === "Easy"
                  ? "bg-green-100 text-green-700"
                  : problem.difficulty === "Medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {problem.difficulty}
            </span>
          </div>
          <p className="font-mono bg-gray-50 p-3 rounded mb-4">
            {problem.problem}
          </p>
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="text-blue-600 hover:text-blue-800"
            aria-expanded={openIdx === idx}
            aria-controls={`practice-solution-${idx}`}
          >
            {openIdx === idx ? "Hide Solution" : "Show Solution"}
          </button>
          {openIdx === idx && (
            <div
              className="mt-2 text-gray-600"
              id={`practice-solution-${idx}`}
              ref={el => (solutionRefs.current[idx] = el)}
              tabIndex={-1}
              aria-live="polite"
            >
              {problem.solution}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Alternative Methods Component
 * @param {object} props
 * @param {Array} props.methods - Array of alternative method objects.
 */
function AlternativeMethods({ methods }) {
  return (
    <div className="space-y-6">
      {methods.map((method, idx) => (
        <div key={idx} className="border-b border-gray-100 pb-6 last:border-0">
          <h4 className="text-lg font-semibold text-purple-600 mb-3">
            {method.name}
          </h4>
          {method.steps.map((step, sidx) => (
            <div key={sidx} className="mb-4">
              <p className="text-gray-600 mb-2">{step.explanation}</p>
              <p className="font-mono bg-gray-50 p-2 rounded">
                {step.equation}
              </p>
            </div>
          ))}
          <p className="text-green-600 font-semibold mt-2">
            Final Answer: {method.final_answer}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * History List Component
 * @param {object} props
 * @param {Array} props.history - Array of history items.
 */
function HistoryList({ history }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 space-y-4">
      {history.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-all duration-300 history-item solution-step animate-slide-up"
          aria-label={t("Previous solution")}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-sm">{cleanEquation(item.input)}</span>
            <span className="text-xs text-gray-500">{item.timestamp}</span>
          </div>
          <div className="text-gray-600">
            Result: {cleanEquation(item.solution.final_answer)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Saved Solutions Component
 * @param {object} props
 */
function SavedSolutions({
  savedSolutions,
  selectedSolution,
  setSelectedSolution,
  toggleFavorite,
  updateNotes,
}) {
  return (
    <div className="mt-4 space-y-4">
      {savedSolutions.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <span className="font-mono text-sm">{item.equation}</span>
              <p className="text-gray-600 mt-2">
                Result: {item.solution?.final_answer || ""}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(item.id, item.is_favorite)}
              className={`text-2xl transition-colors duration-300 ${
                item.is_favorite ? "text-yellow-500" : "text-gray-300"
              }`}
              aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <i className="fas fa-star"></i>
            </button>
          </div>
          {selectedSolution === item.id ? (
            <div className="mt-2">
              <textarea
                value={item.notes || ""}
                onChange={(e) => updateNotes(item.id, e.target.value)}
                placeholder="Add notes..."
                className="w-full p-2 border rounded-lg"
                rows="2"
                aria-label="Edit notes"
              />
              <button
                onClick={() => setSelectedSolution(null)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Done Editing
              </button>
            </div>
          ) : (
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {item.notes || "No notes"}
              </p>
              <button
                onClick={() => setSelectedSolution(item.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit Notes
              </button>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            Saved on: {new Date(item.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =======================
   Main Application
   ======================= */

/**
 * MainComponent
 * The core application container, manages state, orchestrates all main features.
 */
function MainComponent() {
  /* --- State --- */
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [solution, setSolution] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [streamingResponse, setStreamingResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [savedSolutions, setSavedSolutions] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [notes, setNotes] = useState("");
  const [showStepByStep, setShowStepByStep] = useState(true);
  const [showAlternativeMethods, setShowAlternativeMethods] = useState(false);
  const [alternativeSolutions, setAlternativeSolutions] = useState([]);
  const [practiceProblems, setPracticeProblems] = useState([]);
  const [showPractice, setShowPractice] = useState(false);
  const [currentModel, setCurrentModel] = useState("gemini");
  const [showTips, setShowTips] = useState(false);
  const [mathTopic, setMathTopic] = useState("");
  const [showGraph, setShowGraph] = useState(false);

  /* --- Streaming handler --- */
  const handleStreamResponse = useHandleStreamResponse({
    onChunk: (chunk) => setStreamingResponse(chunk),
    onFinish: (message) => {
      setStreamingResponse("");
      try {
        const parsed = JSON.parse(message);
        if (!parsed?.steps || !parsed?.final_answer) {
          setError("Received incomplete solution data. Please try again.");
          return;
        }
        setSolution(parsed);
        setHistory((prev) =>
          [
            ...prev,
            {
              input,
              solution: parsed,
              timestamp: new Date().toLocaleString(),
            },
          ].slice(-5)
        );
      } catch {
        setError("Received invalid response format. Please try again.");
      }
    },
  });

  /* --- Async: Generate Practice Problems --- */
  async function generatePracticeProblems(inp = input) {
    try {
      const response = await fetch("/integrations/google-gemini-1-5/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate 3 similar practice problems based on this math problem: ${inp}. Make them slightly different in difficulty.`,
            },
          ],
          json_schema: {
            name: "practice_problems",
            schema: {
              type: "object",
              properties: {
                problems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      problem: { type: "string" },
                      difficulty: { type: "string" },
                      solution: { type: "string" },
                    },
                    required: ["problem", "difficulty", "solution"],
                  },
                },
              },
              required: ["problems"],
            },
          },
        }),
      });
      if (!response.ok) throw new Error("Failed to generate practice problems");
      const data = await response.json();
      setPracticeProblems(data.choices[0].message.content.problems);
      setShowPractice(true);
    } catch (err) {
      setError("Failed to generate practice problems");
    }
  }

  /* --- Async: Generate Alternative Methods --- */
  async function generateAlternativeMethods(inp = input) {
    try {
      const response = await fetch("/integrations/google-gemini-1-5/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Show two alternative methods to solve this math problem: ${inp}. Explain each method step by step.`,
            },
          ],
          json_schema: {
            name: "alternative_methods",
            schema: {
              type: "object",
              properties: {
                methods: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      steps: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            explanation: { type: "string" },
                            equation: { type: "string" },
                          },
                          required: ["explanation", "equation"],
                        },
                      },
                      final_answer: { type: "string" },
                    },
                    required: ["name", "steps", "final_answer"],
                  },
                },
              },
              required: ["methods"],
            },
          },
        }),
      });
      if (!response.ok)
        throw new Error("Failed to generate alternative methods");
      const data = await response.json();
      setAlternativeSolutions(data.choices[0].message.content.methods);
      setShowAlternativeMethods(true);
    } catch (err) {
      setError("Failed to generate alternative methods");
    }
  }

  /* --- Async: Solve Equation --- */
  async function solveEquation(text) {
    if (!text.trim()) {
      setError("Please enter an equation to solve.");
      return;
    }
    setLoading(true);
    setError(null);
    setSolution(null);
    setStreamingResponse("");
    setMathTopic(detectMathTopic(text));
    setShowAlternativeMethods(false);
    setShowPractice(false);

    try {
      const endpoint =
        currentModel === "gemini"
          ? "/integrations/google-gemini-1-5/"
          : "/integrations/chat-gpt/conversationgpt4";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Solve this mathematical problem and show all steps. Format all mathematical expressions properly without LaTeX or markdown symbols. Make explanations clear and detailed. Problem: ${text}`,
            },
          ],
          json_schema: {
            name: "math_solution",
            schema: {
              type: "object",
              properties: {
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      explanation: { type: "string" },
                      equation: { type: "string" },
                    },
                    required: ["explanation", "equation"],
                  },
                },
                final_answer: { type: "string" },
                difficulty_level: { type: "string" },
                tips: {
                  type: "array",
                  items: { type: "string" },
                },
                graph_data: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    points: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          x: { type: "number" },
                          y: { type: "number" },
                        },
                        required: ["x", "y"],
                      },
                    },
                  },
                  required: ["type", "points"],
                },
              },
              required: ["steps", "final_answer"],
            },
          },
          stream: true,
        }),
      });
      if (!response.ok)
        throw new Error(`Server responded with status: ${response.status}`);
      await handleStreamResponse(response);
    } catch (err) {
      setError(
        err.message ||
          "Sorry, there was a problem solving your equation. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  }

  /* --- Generate additional content after receiving solution --- */
  useEffect(() => {
    if (solution) {
      Promise.all([
        generatePracticeProblems(input),
        generateAlternativeMethods(input),
      ]).catch(() => {});
    }
    // eslint-disable-next-line
  }, [solution]);

  /* --- Async: Handle Image Upload --- */
  async function handleImageUpload() {
    try {
      const { url, error: uploadError } = await upload({ file });
      if (uploadError) throw new Error(uploadError);
      setPreviewImage(URL.createObjectURL(file));
      const response = await fetch("/integrations/gpt-vision/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Read this mathematical problem and express it as a text equation. Only return the equation, nothing else.",
                },
                {
                  type: "image_url",
                  image_url: { url },
                },
              ],
            },
          ],
        }),
      });
      if (!response.ok) throw new Error("Failed to process image");
      const data = await response.json();
      const equation = data.choices[0].message.content;
      setInput(equation);
      solveEquation(equation);
    } catch (err) {
      setError("Failed to process the image. Please try again.");
    }
  }

  /* --- Drag and Drop Handlers --- */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreviewImage(URL.createObjectURL(droppedFile));
    }
  };

  /* --- Clear input, file, solution, error, preview --- */
  const clearAll = () => {
    setInput("");
    setFile(null);
    setSolution(null);
    setError(null);
    setPreviewImage(null);
  };

  /* --- Fetch saved solutions on mount --- */
  useEffect(() => {
    fetchSavedSolutions();
  }, []);

  /* --- Async: Fetch Saved Solutions --- */
  async function fetchSavedSolutions() {
    try {
      const response = await fetch("/api/math-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET" }),
      });
      if (!response.ok) throw new Error("Failed to fetch saved solutions");
      const data = await response.json();
      setSavedSolutions(data);
    } catch (err) {
      setError("Failed to load saved solutions");
    }
  }

  /* --- Async: Save Solution --- */
  async function saveSolution() {
    try {
      await fetch("/api/math-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          equation: input,
          solution: solution,
          notes: notes,
        }),
      });
      setNotes("");
      fetchSavedSolutions();
    } catch {
      setError("Failed to save solution");
    }
  }

  /* --- Async: Toggle Favorite --- */
  async function toggleFavorite(id, currentStatus) {
    try {
      await fetch("/api/math-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "PATCH",
          id,
          is_favorite: !currentStatus,
        }),
      });
      fetchSavedSolutions();
    } catch {
      setError("Failed to update favorite status");
    }
  }

  /* --- Async: Update Notes --- */
  async function updateNotes(id, newNotes) {
    try {
      await fetch("/api/math-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "PATCH",
          id,
          notes: newNotes,
        }),
      });
      fetchSavedSolutions();
    } catch {
      setError("Failed to update notes");
    }
  }

  /* --- Accessibility: Focus management for important actions --- */
  const inputRef = useRef(null);

  useEffect(() => {
    if (!input && inputRef.current) {
      inputRef.current.focus();
    }
  }, [input]);

  /* --- RENDER --- */
  return (
    <ThemeContext.Provider value="light">
      <I18nContext.Provider value={{ locale: "en", t: (x) => x }}>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 md:p-8">
          {/* Accessibility header and motivation banner */}
          <AnimatedBanner />

          {/* Main card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 mb-8 transition-all duration-300 hover:shadow-2xl animate-scale-in animate-glow hover-glow">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() =>
                      setCurrentModel(currentModel === "gemini" ? "gpt" : "gemini")
                    }
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 transition-all duration-300"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Switch to {currentModel === "gemini" ? "GPT" : "Gemini"}
                  </button>
                </div>
              </div>

              {/* Equation input area */}
              <div className="mb-8">
                <label className="block text-gray-700 mb-2 font-semibold text-lg">
                  Enter your equation:
                </label>
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-lg font-mono"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your mathematical problem here (e.g., '2x + 5 = 15' or '1/2 + 3/4' or 'solve for x: x² - 4 = 12')"
                    rows="3"
                    aria-label="Math input area"
                  />
                  {input && (
                    <button
                      onClick={clearAll}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear input"
                    >
                      <i className="fas fa-times-circle"></i>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => solveEquation(input)}
                  disabled={loading || !input}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300"
                  aria-label="Solve equation"
                >
                  {loading ? (
                    <LoadingIndicator loading={loading}>Solving...</LoadingIndicator>
                  ) : (
                    <span>
                      <i className="fas fa-calculator mr-2"></i>Solve
                    </span>
                  )}
                </button>
              </div>

              {/* Image upload area */}
              <div className="border-t border-gray-200 pt-8">
                <label className="block text-gray-700 mb-4 font-semibold text-lg">
                  Or upload/drag an image of your problem:
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors duration-300"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  aria-label="Image upload area"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFile(e.target.files[0]);
                        setPreviewImage(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="hidden"
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    {previewImage ? (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                            setPreviewImage(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          aria-label="Remove image"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-500">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Supports PNG, JPG, JPEG, WEBP
                        </p>
                      </div>
                    )}
                  </label>
                  {file && (
                    <button
                      onClick={handleImageUpload}
                      disabled={uploadLoading}
                      className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                      aria-label="Process uploaded image"
                    >
                      {uploadLoading ? (
                        <LoadingIndicator loading={uploadLoading}>Processing...</LoadingIndicator>
                      ) : (
                        <span>
                          <i className="fas fa-image mr-2"></i>Process Image
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-center animate-slide-in animate-bounce-soft" role="alert">
                <i className="fas fa-exclamation-circle mr-2 animate-sparkle"></i>
                {error}
              </div>
            )}

            {/* Streaming response (while solution is being generated) */}
            {streamingResponse && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-shimmer">
                <div className="flex items-center mb-4">
                  <i className="fas fa-cog mr-2 text-purple-600 loading-icon"></i>
                  <p className="text-gray-600 animate-pulse">
                    Generating detailed solution...
                  </p>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg animate-slide-up">
                  {streamingResponse}
                </pre>
              </div>
            )}

            {/* Solution display */}
            {solution && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl animate-float hover-glow">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-2xl font-bold text-gray-800 animate-pop">
                        Solution
                      </h2>
                      <span className="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm animate-slide-in">
                        Difficulty: {solution.difficulty_level}
                      </span>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowStepByStep(!showStepByStep)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <i
                          className={`fas fa-list-ol mr-2 ${
                            showStepByStep ? "text-purple-600" : ""
                          }`}
                        ></i>
                        {showStepByStep ? "Hide Steps" : "Show Steps"}
                      </button>
                      <button
                        onClick={() => setShowTips(!showTips)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <i
                          className={`fas fa-lightbulb mr-2 ${
                            showTips ? "text-yellow-500" : ""
                          }`}
                        ></i>
                        {showTips ? "Hide Tips" : "Show Tips"}
                      </button>
                      {solution.graph_data && (
                        <button
                          onClick={() => setShowGraph(!showGraph)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <i
                            className={`fas fa-chart-line mr-2 ${
                              showGraph ? "text-blue-500" : ""
                            }`}
                          ></i>
                          {showGraph ? "Hide Graph" : "Show Graph"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tips section */}
                  {showTips && solution.tips?.length > 0 && (
                    <div className="mb-6 bg-yellow-50 p-4 rounded-lg animate-fade-in">
                      <h3 className="text-lg font-semibold text-yellow-700 mb-2">
                        <i className="fas fa-lightbulb mr-2"></i>Tips & Tricks
                      </h3>
                      <ul className="space-y-2">
                        {solution.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Graph section (placeholder for actual graphing lib) */}
                  {showGraph && solution.graph_data && (
                    <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 animate-fade-in">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        <i className="fas fa-chart-line mr-2"></i>Visual
                        Representation
                      </h3>
                      <div className="h-64 w-full flex items-center justify-center text-gray-500">
                        Graph Type: {solution.graph_data.type}
                        {/* Integrate a graphing library here */}
                      </div>
                    </div>
                  )}

                  {/* Step-by-step section */}
                  {showStepByStep && (
                    <div className="space-y-6">
                      {solution.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="border-b border-gray-100 pb-6 solution-step"
                        >
                          <div className="flex items-start">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-4">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-gray-600 mb-3">
                                {step.explanation}
                              </p>
                              <p className="font-mono text-lg bg-gray-50 p-3 rounded-lg">
                                {cleanEquation(step.equation)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Final answer */}
                  <div className="mt-8 pt-6 border-t border-gray-200 animate-scale-in">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-3 text-xl"></i>
                      <p className="text-xl font-bold text-green-600">
                        Final Answer: {cleanEquation(solution.final_answer)}
                      </p>
                    </div>
                  </div>

                  {/* Save solution and notes */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={saveSolution}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300"
                      >
                        <i className="fas fa-save mr-2"></i>Save Solution
                      </button>
                      <div className="flex-1 mx-4">
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes about this solution..."
                          className="w-full p-2 border rounded-lg"
                          aria-label="Add notes"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alternative Methods */}
                {showAlternativeMethods && alternativeSolutions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 animate-float">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      <i className="fas fa-random mr-2"></i>Alternative Methods
                    </h3>
                    <AlternativeMethods methods={alternativeSolutions} />
                  </div>
                )}

                {/* Practice Problems */}
                {showPractice && practiceProblems.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 animate-float">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      <i className="fas fa-dumbbell mr-2"></i>Practice Problems
                    </h3>
                    <PracticeProblems problems={practiceProblems} />
                  </div>
                )}
              </div>
            )}

            {/* History & Saved Solutions */}
            <div className="mt-8 space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-gray-600 hover:text-gray-800 flex items-center transition-all duration-300 transform hover:translate-x-2"
                >
                  <i
                    className={`fas fa-history mr-2 transform transition-transform duration-300 ${
                      showHistory ? "rotate-180" : ""
                    }`}
                  ></i>
                  {showHistory ? "Hide History" : "Show Recent Solutions"}
                </button>
                <button
                  onClick={() => setShowSaved(!showSaved)}
                  className="text-gray-600 hover:text-gray-800 flex items-center transition-all duration-300 transform hover:translate-x-2"
                >
                  <i
                    className={`fas fa-bookmark mr-2 transform transition-transform duration-300 ${
                      showSaved ? "rotate-180" : ""
                    }`}
                  ></i>
                  {showSaved ? "Hide Saved" : "Show Saved Solutions"}
                </button>
              </div>
              {showHistory && history.length > 0 && <HistoryList history={history} />}
              {showSaved && savedSolutions.length > 0 && (
                <SavedSolutions
                  savedSolutions={savedSolutions}
                  selectedSolution={selectedSolution}
                  setSelectedSolution={setSelectedSolution}
                  toggleFavorite={toggleFavorite}
                  updateNotes={updateNotes}
                />
              )}
            </div>
          </div>
        </div>
      </I18nContext.Provider>
    </ThemeContext.Provider>
  );
}

export default MainComponent;

/**
 * End of content.js
 * 
 * This file is heavily documented and extended for demonstration purposes.
 * For production, consider splitting into multiple modules for maintainability.
 */
