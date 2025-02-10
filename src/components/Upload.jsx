import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {ProgressSpinner} from "primereact/progressspinner";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    try {
      const response = await axios.post(
        "https://docanalyzer-backend.onrender.com/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("File Uploaded Successfully!");
      setExtractedText(response.data.text);
      handleAnalyze(response.data.text);
      setFile(null);
    } catch (error) {
      toast.error(
        "Upload failed: " + error.response?.data?.error || error.message
      );
    }
  };

  const handleAnalyze = async (text) => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post("https://docanalyzer-backend.onrender.com/api/analyze", {
        text,
      });
      setAnalysis(response.data);
      toast.success("Text Analyzed Successfully!");
    } catch (error) {
      toast.error(
        "Analysis Failed: " + error.response?.data?.error || error.message
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*/g, "") // Remove double asterisks (**)
      .replace(/\*/g, "") // Remove single asterisks (*)
      .replace(/\n\s*\n/g, "\n") // Remove extra newlines
      .trim(); // Remove extra spaces from start and end
  };

  const formatJSON = (data) => {
    if (!data || typeof data !== "object") return "N/A"; // Handle empty or invalid data

    return Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`; // Format arrays as comma-separated strings
        } else if (typeof value === "object") {
          return `${key}:\n  ${formatJSON(value)}`; // Recursively format nested objects
        }
        return `${key}: ${value}`; // Format key-value pairs
      })
      .join("\n");
  };

  return (
    <div className="container mt-5">
      <div className="card p-4 shadow-sm">
        <h1>DocAnalyzer - A simple document analyzer!</h1>
        <input
          type="file"
          onChange={handleFileChange}
          className="form-control mb-3"
        />
        <button onClick={handleUpload} className="btn btn-primary w-100">
          Upload File
        </button>

        {isAnalyzing && (
          <div className="mt-4 d-flex justify-content-center">
            <ProgressSpinner />
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="mt-4 p-3 border rounded bg-light">
            <h5>Analysis:</h5>
            <p>
              <strong>Summary:</strong> {formatText(analysis.summary)}
            </p>
            <p>
              <strong>Entities:</strong>{" "}
              <pre>{formatJSON(analysis.entities)}</pre>
            </p>
            <p>
              <strong>Sentiment:</strong>{" "}
              <pre>{formatJSON(analysis.sentiment)}</pre>
            </p>
            <p>
              <strong>AI Response:</strong> {formatText(analysis.analysis)}
            </p>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </div>
  );
};

export default Upload;
