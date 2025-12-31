import React, { useState, useRef, useEffect } from 'react';
import { Upload, Share2, Search, X, Settings, Download, Image, FileText, Music, Video, Archive, Trash2, Link2, Minimize2, FolderOpen, Eye, Cloud, ExternalLink, MoreVertical, Copy, Edit, Type, ImagePlus, Moon, Sun, Plus } from 'lucide-react';
import { createZipFromFiles } from './utils/zipHelper';

export default function DropManager() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageUrlDialog, setShowImageUrlDialog] = useState(false);
  
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const inactivityTimer = useRef(null);
  const containerRef = useRef(null);

  // Charger les fichiers depuis localStorage
  useEffect(() => {
    const savedFiles = localStorage.getItem('dropmanager_files');
    const savedTheme = localStorage.getItem('dropmanager_theme');
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error('Erreur de chargement:', e);
      }
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem('dropmanager_files', JSON.stringify(files));
    } else {
      localStorage.removeItem('dropmanager_files');
    }
  }, [files]);

  useEffect(() => {
    localStorage.setItem('dropmanager_theme', theme);
  }, [theme]);

  // Timer d'inactivité
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      setIsMinimized(true);
    }, 60000);
  };

  useEffect(() => {
    const handleMouseMove = () => resetInactivityTimer();
    const handleMouseEnter = () => resetInactivityTimer();
    
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseenter', handleMouseEnter);
    }

    resetInactivityTimer();

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseenter', handleMouseEnter);
      }
    };
  }, []);

  // Détection de drag global
  useEffect(() => {
    const handleGlobalDragEnter = (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        setShowDropZone(true);
        if (isMinimized) setIsMinimized(false);
      }
    };

    window.addEventListener('dragenter', handleGlobalDragEnter);
    return () => window.removeEventListener('dragenter', handleGlobalDragEnter);
  }, [isMinimized]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setShowDropZone(false);

    const items = Array.from(e.dataTransfer.items);
    const newFiles = [];

    for (let item of items) {
      if (item.type === 'text/uri-list' || item.type === 'text/plain') {
        const text = await new Promise(resolve => item.getAsString(resolve));
        if (text.startsWith('http')) {
          newFiles.push({
            id: Date.now() + Math.random(),
            name: text,
            size: 0,
            type: 'link',
            addedAt: new Date().toISOString(),
            isLink: true,
            url: text
          });
        }
        continue;
      }

      const file = item.getAsFile();
      if (file) {
        let dataUrl = null;
        
        if (file.type.startsWith('image/')) {
          dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        } else if (file.type === 'text/plain') {
          const text = await file.text();
          newFiles.push({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: 'text',
            addedAt: new Date().toISOString(),
            isText: true,
            content: text
          });
          continue;
        }

        newFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
          addedAt: new Date().toISOString(),
          dataUrl: dataUrl
        });
      }
    }

    setFiles(prev => [...newFiles, ...prev]);
  };

  const handleFileInput = async (e) => {
    const selectedFiles = await Promise.all(
      Array.from(e.target.files).map(async (file) => {
        let dataUrl = null;
        if (file.type.startsWith('image/')) {
          dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }

        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
          addedAt: new Date().toISOString(),
          dataUrl: dataUrl
        };
      })
    );
    setFiles(prev => [...selectedFiles, ...prev]);
    setShowDropZone(false);
  };

  const addTextNote = (content) => {
    if (content.trim()) {
      setFiles(prev => [{
        id: Date.now(),
        name: 'Note',
        size: content.length,
        type: 'text',
        addedAt: new Date().toISOString(),
        isText: true,
        content: content
      }, ...prev]);
    }
  };

  const addImageFromUrl = async () => {
    if (imageUrlInput.trim()) {
      try {
        const response = await fetch(imageUrlInput);
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(blob);
        });
        
        setFiles(prev => [{
          id: Date.now(),
          name: imageUrlInput.split('/').pop() || 'Image web',
          size: blob.size,
          type: blob.type,
          addedAt: new Date().toISOString(),
          dataUrl: dataUrl,
          isWebImage: true
        }, ...prev]);
        
        setImageUrlInput('');
        setShowImageUrlDialog(false);
      } catch (error) {
        alert('Impossible de charger l\'image depuis cette URL');
      }
    }
  };

  const updateTextContent = (id, newContent) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, content: newContent, size: newContent.length } : f
    ));
    setEditingText(null);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setActiveMenu(null);
  };

  const clearAll = () => {
    setFiles([]);
  };

  const closeApp = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const minimizeApp = () => {
    setIsMinimized(!isMinimized);
  };

  const downloadFile = (file) => {
    if (file.isLink) {
      window.open(file.url, '_blank');
      return;
    }

    if (file.isText) {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      a.click();
    }
  };

  const shareFile = async (file) => {
    if (navigator.share && file.file) {
      try {
        await navigator.share({
          title: file.name,
          files: [file.file]
        });
      } catch (error) {
        alert('Partage non disponible');
      }
    } else {
      alert('Partage non disponible dans cette version');
    }
  };

  const createZipArchive = async () => {
    if (files.length === 0) {
      alert('Aucun fichier à compresser');
      return;
    }
    
    setIsCompressing(true);
    try {
      await createZipFromFiles(files);
      alert('Archive ZIP créée avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de l\'archive');
    }
    setIsCompressing(false);
  };

  const handleFileDragStart = (e, file) => {
    if (file.dataUrl) {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('DownloadURL', `${file.type}:${file.name}:${file.dataUrl}`);
    }
  };

  const getFileIcon = (type, isText) => {
    if (isText) return <Type className="w-5 h-5" />;
    if (type === 'link') return <Link2 className="w-5 h-5" />;
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (file.content && file.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl cursor-pointer hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        onClick={() => setIsMinimized(false)}
        onDragEnter={handleDragEnter}
      >
        <Upload className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        {files.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            {files.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`fixed bottom-4 right-4 w-96 h-[600px] ${theme === 'dark' ? 'bg-zinc-900/95' : 'bg-white/95'} backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200/50'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
    >
      {/* Barre de titre */}
      <div 
        className={`h-12 ${theme === 'dark' ? 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80' : 'bg-gradient-to-r from-gray-100/80 to-gray-50/80'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-zinc-700/50' : 'border-gray-200/50'} flex items-center justify-between px-3 drag-handle cursor-move`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Upload className="w-3.5 h-3.5 text-white" />
          </div>
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm`}>DropManager</span>
          {files.length > 0 && (
            <span className={`px-2 py-0.5 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'} rounded-lg text-xs font-medium`}>
              {files.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-all duration-200 hover:scale-110 ${showSearch ? 'bg-blue-500/20 text-blue-400' : ''}`}
            title="Rechercher"
          >
            <Search className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowDropZone(!showDropZone)}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-all duration-200 hover:scale-110 ${showDropZone ? 'bg-blue-500/20 text-blue-400' : ''}`}
            title="Zone de dépôt"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-all duration-200 hover:scale-110`}
            title="Thème"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-all duration-200 hover:scale-110`}
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={minimizeApp}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'} transition-all duration-200 hover:scale-110`}
            title="Réduire"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={closeApp}
            className={`p-2 rounded-lg hover:bg-red-500/20 transition-all duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hover:text-red-400 hover:scale-110`}
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panneau paramètres */}
      {showSettings && (
        <div className={`${theme === 'dark' ? 'bg-zinc-800/95' : 'bg-gray-50/95'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-zinc-700/50' : 'border-gray-200/50'} p-4 animate-in slide-in-from-top duration-200`}>
          <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold mb-3 text-sm`}>Options</h3>
          <div className="space-y-2">
            <button 
              onClick={createZipArchive}
              disabled={isCompressing || files.length === 0}
              className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-zinc-700/50 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded-xl transition-all duration-200 flex items-center space-x-2 text-sm disabled:opacity-50`}
            >
              <Archive className="w-4 h-4" />
              <span>{isCompressing ? 'Compression...' : 'Créer archive ZIP'}</span>
            </button>
            <button 
              onClick={() => setShowImageUrlDialog(true)}
              className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'} rounded-xl transition-all duration-200 flex items-center space-x-2 text-sm`}
            >
              <ImagePlus className="w-4 h-4" />
              <span>Ajouter image web</span>
            </button>
            <button 
              onClick={clearAll}
              disabled={files.length === 0}
              className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-700'} rounded-xl transition-all duration-200 flex items-center space-x-2 text-sm disabled:opacity-50`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Effacer tout</span>
            </button>
          </div>
          <div className={`mt-4 pt-3 border-t ${theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2 font-medium`}>Raccourci clavier</p>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Afficher/Masquer</span>
              <kbd className={`px-2 py-1 ${theme === 'dark' ? 'bg-zinc-700 text-gray-300' : 'bg-gray-200 text-gray-700'} rounded text-xs font-mono`}>Ctrl+Shift+D</kbd>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      {showSearch && (
        <div className="px-4 pt-3 pb-2 animate-in slide-in-from-top duration-200">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className={`w-full pl-10 pr-3 py-2 rounded-xl ${theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-gray-100 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
            />
          </div>
        </div>
      )}

      {/* Zone de drop (conditionnelle) */}
      {showDropZone && (
        <div className="px-4 pt-3 pb-2 animate-in slide-in-from-top duration-200">
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                : theme === 'dark' 
                  ? 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            } p-6 cursor-pointer group`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-12 rounded-xl ${isDragging ? 'bg-blue-500 scale-110' : 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center transition-all duration-300`}>
                <Upload className="w-6 h-6 text-white" />
              </div>
              <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium text-sm text-center`}>
                {isDragging ? 'Déposez ici' : 'Glissez vos fichiers'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Dialog image URL */}
      {showImageUrlDialog && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className={`${theme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl p-5 w-full max-w-sm animate-in zoom-in duration-200`}>
            <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold mb-3`}>Image web</h3>
            <input
              type="url"
              placeholder="https://exemple.com/image.jpg"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl ${theme === 'dark' ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3`}
            />
            <div className="flex space-x-2">
              <button
                onClick={addImageFromUrl}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowImageUrlDialog(false);
                  setImageUrlInput('');
                }}
                className={`flex-1 px-4 py-2 ${theme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-200 text-gray-900'} rounded-xl hover:opacity-80 transition-opacity text-sm font-medium`}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grille de fichiers */}
      <div className="h-[calc(100%-3rem)] overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {filteredFiles.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center py-8 animate-in fade-in duration-500">
              <FolderOpen className={`w-16 h-16 mx-auto mb-3 ${theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`} />
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                {searchQuery ? 'Aucun résultat' : 'Aucun fichier'}
              </p>
              <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} text-xs mt-1`}>
                Cliquez sur + pour ajouter
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-3">
            {filteredFiles.map((file, index) => (
              <div
                key={file.id}
                draggable={!file.isText}
                onDragStart={(e) => handleFileDragStart(e, file)}
                className={`relative group p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700' : 'bg-white hover:bg-gray-50 border-gray-200'} border hover:shadow-xl transition-all duration-200 cursor-move animate-in zoom-in`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Menu contextuel (au premier plan) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === file.id ? null : file.id);
                  }}
                  className={`absolute top-2 right-2 z-20 p-1.5 rounded-lg ${theme === 'dark' ? 'bg-zinc-900/80 hover:bg-zinc-700' : 'bg-white/80 hover:bg-gray-100'} backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg`}
                >
                  <MoreVertical className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
                </button>

                {/* Menu déroulant */}
                {activeMenu === file.id && (
                  <div className={`absolute right-2 top-10 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-xl shadow-2xl border ${theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'} p-1.5 z-30 min-w-[140px] animate-in fade-in zoom-in duration-200`}>
                    {file.dataUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPreview(file);
                          setActiveMenu(null);
                        }}
                        className={`w-full px-3 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-700 text-white' : 'hover:bg-gray-100 text-gray-900'} text-left flex items-center space-x-2 text-xs transition-colors`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Aperçu</span>
                      </button>
                    )}
                    {file.isText && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingText(file.id);
                          setActiveMenu(null);
                        }}
                        className={`w-full px-3 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-700 text-white' : 'hover:bg-gray-100 text-gray-900'} text-left flex items-center space-x-2 text-xs transition-colors`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                        setActiveMenu(null);
                      }}
                      className={`w-full px-3 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-700 text-white' : 'hover:bg-gray-100 text-gray-900'} text-left flex items-center space-x-2 text-xs transition-colors`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{file.isLink ? 'Ouvrir' : 'Télécharger'}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareFile(file);
                        setActiveMenu(null);
                      }}
                      className={`w-full px-3 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-700 text-white' : 'hover:bg-gray-100 text-gray-900'} text-left flex items-center space-x-2 text-xs transition-colors`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Partager</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(file.isLink ? file.url : file.name);
                        setActiveMenu(null);
                      }}
                      className={`w-full px-3 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-zinc-700 text-white' : 'hover:bg-gray-100 text-gray-900'} text-left flex items-center space-x-2 text-xs transition-colors`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </button>
                    <div className={`my-1 border-t ${theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-500 text-left flex items-center space-x-2 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}

                {/* Contenu de la carte */}
                <div className="flex flex-col items-center space-y-2">
                  {editingText === file.id ? (
                    <textarea
                      value={file.content}
                      onChange={(e) => updateTextContent(file.id, e.target.value)}
                      onBlur={() => setEditingText(null)}
                      autoFocus
                      className={`w-full h-20 px-2 py-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-700 text-white' : 'bg-gray-100 text-gray-900'} text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  ) : (
                    <>
                      {file.dataUrl ? (
                        <img 
                          src={file.dataUrl} 
                          alt={file.name}
                          className="w-full h-24 rounded-lg object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setShowPreview(file)}
                        />
                      ) : (
                        <div 
                          className={`w-full h-24 rounded-lg ${theme === 'dark' ? 'bg-zinc-700/50' : 'bg-gray-100'} flex items-center justify-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} cursor-pointer hover:scale-105 transition-transform`}
                          onClick={() => file.isText ? setEditingText(file.id) : null}
                        >
                          {getFileIcon(file.type, file.isText)}
                        </div>
                      )}
                      
                      <div className="w-full text-center">
                        <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium text-xs truncate px-1`}>
                          {file.isText ? file.content.substring(0, 20) + (file.content.length > 20 ? '...' : '') : file.name}
                        </h3>
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs mt-0.5`}>
                          {file.isLink ? 'Lien' : file.isText ? `${file.content.length} car.` : formatSize(file.size)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'aperçu */}
      {showPreview && (
        <div 
          className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-40 animate-in fade-in duration-200"
          onClick={() => setShowPreview(null)}
        >
          <div className="max-w-full max-h-full flex flex-col items-center">
            {showPreview.type.startsWith('video/') && showPreview.file ? (
              <video 
                src={URL.createObjectURL(showPreview.file)} 
                controls 
                className="max-w-full max-h-[450px] rounded-2xl shadow-2xl"
              />
            ) : showPreview.type.startsWith('audio/') && showPreview.file ? (
              <div className={`p-8 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl shadow-2xl`}>
                <Music className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                <audio 
                  src={URL.createObjectURL(showPreview.file)} 
                  controls 
                  className="w-72"
                />
              </div>
            ) : showPreview.dataUrl ? (
              <img 
                src={showPreview.dataUrl} 
                alt={showPreview.name}
                className="max-w-full max-h-[450px] rounded-2xl shadow-2xl"
              />
            ) : showPreview.isText ? (
              <div className={`max-w-md w-full p-6 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl shadow-2xl max-h-[450px] overflow-y-auto`}>
                <pre className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap font-sans`}>
                  {showPreview.content}
                </pre>
              </div>
            ) : showPreview.isLink ? (
              <div className={`p-8 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-white'} rounded-2xl shadow-2xl text-center`}>
                <ExternalLink className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4 break-all`}>
                  {showPreview.url}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(showPreview.url, '_blank');
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Ouvrir le lien
                </button>
              </div>
            ) : null}
            <p className="text-white text-center mt-4 font-medium text-sm px-4 break-all">
              {showPreview.name}
            </p>
          </div>
        </div>
      )}

      {/* Overlay pour fermer les menus */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}