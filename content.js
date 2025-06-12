"use client";
import React from "react";

import {
  useUpload,
  useHandleStreamResponse,
} from "../utilities/runtime-helpers";

function MainComponent() {
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
  const [currentModel, setCurrentModel] = useState("gemini"); // or "gpt"
  const [showTips, setShowTips] = useState(false);
  const [mathTopic, setMathTopic] = useState("");
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState(null);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: (chunk) => {
      try {
        setStreamingResponse(chunk);
      } catch (err) {
        console.error("Error handling chunk:", err);
      }
    },
    onFinish: (message) => {
      try {
        setStreamingResponse("");
        // Try to parse the message, if it fails, show the raw message
        let parsedSolution;
        try {
          parsedSolution = JSON.parse(message);
        } catch (parseErr) {
          console.error("Error parsing solution JSON:", parseErr);
          setError("Received invalid response format. Please try again.");
          return;
        }

        // Validate the parsed solution has the required fields
        if (
          !parsedSolution ||
          !parsedSolution.steps ||
          !parsedSolution.final_answer
        ) {
          console.error("Invalid solution format:", parsedSolution);
          setError("Received incomplete solution data. Please try again.");
          return;
        }

        setSolution(parsedSolution);
        setHistory((prev) =>
          [
            ...prev,
            {
              input,
              solution: parsedSolution,
              timestamp: new Date().toLocaleString(),
            },
          ].slice(-5)
        );
      } catch (err) {
        console.error("Error in onFinish:", err);
        setError(
          "There was a problem processing the solution. Please try again."
        );
      }
    },
  });

  const detectMathTopic = (input) => {
    if (input.includes("=")) return "Algebra";
    if (input.includes("sin") || input.includes("cos") || input.includes("tan"))
      return "Trigonometry";
    if (input.includes("∫") || input.includes("d/dx")) return "Calculus";
    if (input.includes("√")) return "Roots";
    if (input.includes("%")) return "Percentages";
    if (input.includes("matrix") || input.includes("[")) return "Matrices";
    return "General Mathematics";
  };

  const generatePracticeProblems = async () => {
    try {
      const response = await fetch("/integrations/google-gemini-1-5/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate 3 similar practice problems based on this math problem: ${input}. Make them slightly different in difficulty.`,
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
                    additionalProperties: false,
                  },
                },
              },
              required: ["problems"],
              additionalProperties: false,
            },
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate practice problems");
      const data = await response.json();
      setPracticeProblems(data.choices[0].message.content.problems);
      setShowPractice(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate practice problems");
    }
  };

  const generateAlternativeMethods = async () => {
    try {
      const response = await fetch("/integrations/google-gemini-1-5/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Show two alternative methods to solve this math problem: ${input}. Explain each method step by step.`,
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
                          additionalProperties: false,
                        },
                      },
                      final_answer: { type: "string" },
                    },
                    required: ["name", "steps", "final_answer"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["methods"],
              additionalProperties: false,
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
      console.error(err);
      setError("Failed to generate alternative methods");
    }
  };

  const solveEquation = async (text) => {
    if (!text.trim()) {
      setError("Please enter an equation to solve.");
      return;
    }

    setLoading(true);
    setError(null);
    setSolution(null);
    setStreamingResponse("");
    setMathTopic(detectMathTopic(text));

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
              content: `Solve this mathematical problem and show all steps. Format all mathematical expressions properly without LaTeX or markdown symbols. Make explanations clear and detailed, and ensure all math symbols are written in plain text: ${text}`,
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

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      await handleStreamResponse(response);

      // Only try to generate additional content if we have a valid solution
      if (solution) {
        try {
          await Promise.all([
            generatePracticeProblems(),
            generateAlternativeMethods(),
          ]);
        } catch (additionalErr) {
          console.error("Error generating additional content:", additionalErr);
          // Don't set error here as the main solution was successful
        }
      }
    } catch (err) {
      console.error("Error solving equation:", err);
      setError(
        err.message ||
          "Sorry, there was a problem solving your equation. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        throw new Error(uploadError);
      }

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
                  text: "Read this mathematical problem and express it as a text equation. Only return the equation, nothing else. Make sure to properly format fractions, exponents, and special mathematical symbols.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: url,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      const equation = data.choices[0].message.content;
      setInput(equation);
      solveEquation(equation);
    } catch (err) {
      setError("Failed to process the image. Please try again.");
      console.error(err);
    }
  };

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

  const clearAll = () => {
    setInput("");
    setFile(null);
    setSolution(null);
    setError(null);
    setPreviewImage(null);
  };

  useEffect(() => {
    fetchSavedSolutions();
  }, []);

  const fetchSavedSolutions = async () => {
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
      console.error(err);
      setError("Failed to load saved solutions");
    }
  };

  const saveSolution = async () => {
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
    } catch (err) {
      console.error(err);
      setError("Failed to save solution");
    }
  };

  const toggleFavorite = async (id, currentStatus) => {
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
    } catch (err) {
      console.error(err);
      setError("Failed to update favorite status");
    }
  };

  const updateNotes = async (id, newNotes) => {
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
    } catch (err) {
      console.error(err);
      setError("Failed to update notes");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 md:p-8">
      <style jsx global>{`
        /* Enhanced Animation Keyframes */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          0% { transform: translateX(-30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }

        @keyframes glowPulse {
          0% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.2); }
          50% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.6); }
          100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.2); }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes floatIn {
          0% { transform: translateY(30px) scale(0.95); opacity: 0; }
          50% { transform: translateY(-15px) scale(1.02); opacity: 0.5; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }

        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes slideUpFade {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        /* Enhanced Animation Classes */
        .animate-fade-in {
          animation: fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-bounce-soft {
          animation: bounce 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-glow {
          animation: glowPulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-rotate {
          animation: rotate 1.5s linear infinite;
        }

        .animate-float {
          animation: floatIn 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.8) 50%,
            rgba(255,255,255,0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }

        .animate-sparkle {
          animation: sparkle 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-wave {
          animation: wave 2s infinite ease-in-out;
        }

        .animate-pop {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-slide-up {
          animation: slideUpFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Enhanced Step Animations */
        .solution-step {
          opacity: 0;
          animation: floatIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .solution-step:nth-child(1) { animation-delay: 0.1s; }
        .solution-step:nth-child(2) { animation-delay: 0.2s; }
        .solution-step:nth-child(3) { animation-delay: 0.3s; }
        .solution-step:nth-child(4) { animation-delay: 0.4s; }
        .solution-step:nth-child(5) { animation-delay: 0.5s; }

        /* Enhanced Interactive Animations */
        button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        button:active {
          transform: translateY(-1px) scale(0.98);
        }

        textarea {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        textarea:focus {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(147, 51, 234, 0.2);
        }

        .history-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .history-item:hover {
          transform: translateX(10px) scale(1.02);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        /* Enhanced Loading States */
        .loading-icon {
          animation: rotate 1.5s linear infinite, glow 2s infinite;
        }

        .success-icon {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Enhanced Hover Effects */
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(147, 51, 234, 0.4);
        }

        .hover-scale:hover {
          transform: scale(1.05);
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-float">
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-roboto animate-bounce-soft hover-scale">
            MathMaster Pro
          </h1>
          <p className="text-gray-600 text-lg animate-fade-in animate-wave">
            Your Advanced Mathematical Problem Solver
          </p>
          {mathTopic && (
            <div className="mt-2 text-sm text-purple-600 animate-fade-in">
              Current Topic: {mathTopic}
            </div>
          )}
        </div>

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

          <div className="mb-8">
            <label className="block text-gray-700 mb-2 font-semibold text-lg">
              Enter your equation:
            </label>
            <div className="relative">
              <textarea
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-lg font-mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your mathematical problem here (e.g., '2x + 5 = 15' or '1/2 + 3/4' or 'solve for x: x² - 4 = 12')"
                rows="3"
              />
              {input && (
                <button
                  onClick={clearAll}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times-circle"></i>
                </button>
              )}
            </div>
            <button
              onClick={() => solveEquation(input)}
              disabled={loading || !input}
              className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <span>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Solving...
                </span>
              ) : (
                <span>
                  <i className="fas fa-calculator mr-2"></i>Solve
                </span>
              )}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <label className="block text-gray-700 mb-4 font-semibold text-lg">
              Or upload/drag an image of your problem:
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors duration-300"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
                >
                  {uploadLoading ? (
                    <span>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </span>
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

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-center animate-slide-in animate-bounce-soft">
            <i className="fas fa-exclamation-circle mr-2 animate-sparkle"></i>
            {error}
          </div>
        )}

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

              {showTips && solution.tips.length > 0 && (
                <div className="mb-6 bg-yellow-50 p-4 rounded-lg animate-fade-in">
                  <h3 className="text-lg font-semibold text-yellow-700 mb-2">
                    <i className="fas fa-lightbulb mr-2"></i>Tips & Tricks
                  </h3>
                  <ul className="space-y-2">
                    {solution.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showGraph && solution.graph_data && (
                <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 animate-fade-in">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    <i className="fas fa-chart-line mr-2"></i>Visual
                    Representation
                  </h3>
                  <div className="h-64 w-full">
                    {/* Add graph visualization here using solution.graph_data */}
                    <div className="text-center text-gray-500">
                      Graph Type: {solution.graph_data.type}
                      {/* You would typically use a graphing library here */}
                    </div>
                  </div>
                </div>
              )}

              {showStepByStep && (
                <div className="space-y-6">
                  {solution.steps.map((step, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-6 solution-step"
                    >
                      <div className="flex items-start">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-4">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-gray-600 mb-3">
                            {step.explanation}
                          </p>
                          <p className="font-mono text-lg bg-gray-50 p-3 rounded-lg">
                            {step.equation
                              .replace(/\\/g, "")
                              .replace(/\{|\}/g, "")
                              .replace(/\$/g, "")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 animate-scale-in">
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-3 text-xl"></i>
                  <p className="text-xl font-bold text-green-600">
                    Final Answer:{" "}
                    {solution.final_answer
                      .replace(/\\/g, "")
                      .replace(/\{|\}/g, "")
                      .replace(/\$/g, "")}
                  </p>
                </div>
              </div>

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
                    />
                  </div>
                </div>
              </div>
            </div>

            {showAlternativeMethods && alternativeSolutions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 animate-float">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  <i className="fas fa-random mr-2"></i>Alternative Methods
                </h3>
                <div className="space-y-6">
                  {alternativeSolutions.map((method, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-6 last:border-0"
                    >
                      <h4 className="text-lg font-semibold text-purple-600 mb-3">
                        {method.name}
                      </h4>
                      {method.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="mb-4">
                          <p className="text-gray-600 mb-2">
                            {step.explanation}
                          </p>
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
              </div>
            )}

            {showPractice && practiceProblems.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 animate-float">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  <i className="fas fa-dumbbell mr-2"></i>Practice Problems
                </h3>
                <div className="space-y-6">
                  {practiceProblems.map((problem, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-6 last:border-0"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-semibold">
                          Problem {index + 1}
                        </span>
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
                      <div className="collapse-solution">
                        <button
                          onClick={() => {
                            const element = document.getElementById(
                              `solution-${index}`
                            );
                            element.style.display =
                              element.style.display === "none"
                                ? "block"
                                : "none";
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Show/Hide Solution
                        </button>
                        <div
                          id={`solution-${index}`}
                          style={{ display: "none" }}
                          className="mt-2 text-gray-600"
                        >
                          {problem.solution}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

          {showHistory && history.length > 0 && (
            <div className="mt-4 space-y-4">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-all duration-300 history-item solution-step animate-slide-up"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm">
                      {item.input
                        .replace(/\\/g, "")
                        .replace(/\{|\}/g, "")
                        .replace(/\$/g, "")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.timestamp}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Result:{" "}
                    {item.solution.final_answer
                      .replace(/\\/g, "")
                      .replace(/\{|\}/g, "")
                      .replace(/\$/g, "")}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSaved && savedSolutions.length > 0 && (
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
                        Result: {item.solution.final_answer}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(item.id, item.is_favorite)}
                      className={`text-2xl transition-colors duration-300 ${
                        item.is_favorite ? "text-yellow-500" : "text-gray-300"
                      }`}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
