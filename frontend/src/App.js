import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [registries, setRegistries] = useState([]);
  const [moduleFile, setModuleFile] = useState(null);
  const [moduleName, setModuleName] = useState('');
  const [moduleScore, setModuleScore] = useState('');

  useEffect(() => {
    const fetchModules = async () => {
      try {
        console.log('Fetching modules with search term:', searchTerm);
        const response = await fetch(
          searchTerm
            ? `http://3.94.252.58:3001/modules?name=${encodeURIComponent(searchTerm)}`
            : `http://3.94.252.58:3001/modules`
        );
        const data = await response.json();
        console.log('Fetched modules:', data);
        setRegistries(data);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };
  
    fetchModules();
  }, [searchTerm]);
  

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('module', moduleFile);
    formData.append('name', moduleName);
    formData.append('score', moduleScore);
  
    try {
      const response = await fetch('http://3.94.252.58:3001/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('Module uploaded successfully');
        setSearchTerm(''); // Reset search term to trigger re-fetching all modules
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading module:', error);
    }
  };
  

  const handleDownload = async (id) => {
    console.log('Downloading module with ID:', id);

    try {
      const response = await fetch(`http://3.94.252.58:3001/download/${id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${registries.find((module) => module.id === id).name}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Download failed:', response.statusText);
        alert('Download failed');
      }
    } catch (error) {
      console.error('Error downloading module:', error);
    }
  };

  const filteredRegistries = registries.filter((registry) =>
    registry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="App">
      <h1 className="header">ECE 461 Group 19 - Trustworthy Module Registry - #6</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search existing modules ..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            console.log('Updated search term:', e.target.value);  // Log new search term value
          }}
          className="search-bar"
        />
        <input type="file" onChange={(e) => setModuleFile(e.target.files[0])} />
        <input type="text" placeholder="Module Name" onChange={(e) => setModuleName(e.target.value)} />
        <input type="number" placeholder="Module Score" onChange={(e) => setModuleScore(e.target.value)} />
        <button onClick={handleUpload} className="upload-button">Upload New Module</button>
      </div>
      <div className="registry-list">
        {filteredRegistries.map((registry) => (
          <div className="registry-box" key={registry.id}>
            <h3 className="module-name">{registry.name}</h3>
            <p className="module-score">Score: {registry.score}</p>
            <button onClick={() => handleDownload(registry.id)} className="download-button">
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
