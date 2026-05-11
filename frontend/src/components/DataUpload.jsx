import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUpload, FaFileExcel, FaCheckCircle, FaSpinner, FaTrash, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const DataUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'https://aquawatch-final-1083164910658.asia-south1.run.app';

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      
      // Preview first few rows
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const rows = content.split('\n').slice(0, 6);
        setPreview(rows);
      };
      reader.readAsText(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/analyze/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        console.log("Upload response:", response.data);
        setUploadResult(response.data);
        localStorage.setItem('currentAnalysis', JSON.stringify(response.data));
        toast.success(`Analysis complete! ${response.data.total_records} records processed`);
        // Navigate to results page
        navigate('/dashboard/results');
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setUploadResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Upload Water Quality Data</h2>
        <p className="text-gray-400 mb-6">Upload CSV or Excel files containing water quality parameters</p>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
            isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <FaUpload className="text-5xl text-gray-500 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-white">Drop the file here...</p>
          ) : (
            <>
              <p className="text-white mb-2">Drag & drop a file here</p>
              <p className="text-gray-400 text-sm">or click to browse</p>
              <p className="text-gray-500 text-xs mt-4">Supports: CSV, XLSX, XLS</p>
            </>
          )}
        </div>

        {file && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <FaFileExcel className="text-green-500 text-2xl" />
                <div>
                  <div className="text-white font-medium">{file.name}</div>
                  <div className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</div>
                </div>
              </div>
              <button onClick={clearFile} className="text-red-400 hover:text-red-300 transition">
                <FaTrash />
              </button>
            </div>
            
            {preview && (
              <div className="mt-3">
                <div className="text-gray-400 text-sm mb-2">Preview:</div>
                <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                  {preview.map((row, idx) => (
                    <code key={idx} className="text-xs text-gray-400 block font-mono">
                      {row}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" /> Processing...
              </span>
            ) : (
              'Analyze Data'
            )}
          </button>
          
          <button
            onClick={() => navigate('/dashboard/results')}
            className="px-6 py-3 bg-gray-700 rounded-lg text-white font-semibold hover:bg-gray-600 transition"
          >
            View Results
          </button>
        </div>

        {/* Upload Result Summary */}
        {uploadResult && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <FaCheckCircle />
              <span className="font-semibold">Upload Successful!</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{uploadResult.total_records}</div>
                <div className="text-gray-400 text-xs">Records</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{uploadResult.anomalies}</div>
                <div className="text-gray-400 text-xs">Anomalies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{uploadResult.average_dwsi?.toFixed(1)}</div>
                <div className="text-gray-400 text-xs">Avg DWSI</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-white font-semibold mb-3">Required Format</h3>
        <div className="text-gray-400 text-sm space-y-2">
          <p>Your file should contain the following columns:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code className="bg-gray-800 px-2 py-1 rounded">ph</code> - pH value (6.5 - 8.5)</li>
            <li><code className="bg-gray-800 px-2 py-1 rounded">temperature</code> - Water temperature in °C</li>
            <li><code className="bg-gray-800 px-2 py-1 rounded">do</code> - Dissolved Oxygen (mg/L)</li>
            <li><code className="bg-gray-800 px-2 py-1 rounded">turbidity</code> - Turbidity (NTU)</li>
            <li><code className="bg-gray-800 px-2 py-1 rounded">salinity</code> - Salinity (PSU)</li>
          </ul>
          <p className="mt-3 text-yellow-400">⚠️ Missing columns will use default values</p>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
