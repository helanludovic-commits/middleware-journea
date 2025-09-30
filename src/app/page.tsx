"use client"

import React, { useState, useEffect } from 'react';
import { Map, Plus, Calendar, Trash2, X, MapPin, Edit2 } from 'lucide-react';

export default function TravelPlannerApp() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectEndDate, setNewProjectEndDate] = useState('');
  
  // Charger les projets au démarrage
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Erreur lors du chargement des projets');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Veuillez entrer un nom de projet');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          start_date: newProjectStartDate,
          end_date: newProjectEndDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du projet');
      }

      const data = await response.json();
      
      setProjects([...projects, data]);
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectStartDate('');
      setNewProjectEndDate('');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditProject = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description || '');
    setNewProjectStartDate(project.start_date || '');
    setNewProjectEndDate(project.end_date || '');
    setShowEditProjectModal(true);
  };

  const handleUpdateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Veuillez entrer un nom de projet');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          start_date: newProjectStartDate,
          end_date: newProjectEndDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification du projet');
      }

      const data = await response.json();
      
      setProjects(projects.map(p => p.id === editingProject.id ? data : p));
      if (selectedProject?.id === editingProject.id) {
        setSelectedProject(data);
      }
      setShowEditProjectModal(false);
      setEditingProject(null);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectStartDate('');
      setNewProjectEndDate('');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du projet');
      }

      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // Vue liste des projets
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Map className="w-8 h-8 text-slate-700" />
              <h1 className="text-2xl font-bold text-slate-800">Travel Planner</h1>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer un projet
            </button>
          </div>
        </header>

        {/* Liste des projets */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Mes Projets de Voyage</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Map className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Aucun projet pour le moment</p>
              <p className="text-slate-400 mt-2">Créez votre premier projet de voyage !</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className={`p-6 hover:bg-slate-50 transition-colors cursor-pointer ${
                    index !== projects.length - 1 ? 'border-b border-slate-200' : ''
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-800">{project.name}</h3>
                        {project.description && (
                          <span className="text-slate-500 text-sm">• {project.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : 'Date non définie'}
                          {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('fr-FR')}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleEditProject(project, e)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal Nouveau Projet */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Nouveau Projet</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Ex: Voyage à Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    rows="3"
                    placeholder="Description du projet..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={newProjectStartDate}
                      onChange={(e) => setNewProjectStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={newProjectEndDate}
                      onChange={(e) => setNewProjectEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                    setNewProjectStartDate('');
                    setNewProjectEndDate('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Créer le projet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Modifier Projet */}
        {showEditProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Modifier le Projet</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Ex: Voyage à Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    rows="3"
                    placeholder="Description du projet..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={newProjectStartDate}
                      onChange={(e) => setNewProjectStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={newProjectEndDate}
                      onChange={(e) => setNewProjectEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditProjectModal(false);
                    setEditingProject(null);
                    setNewProjectName('');
                    setNewProjectDescription('');
                    setNewProjectStartDate('');
                    setNewProjectEndDate('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateProject}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vue détail du projet
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProject(null)}
              className="text-slate-600 hover:text-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">{selectedProject.name}</h1>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditProject(selectedProject, e);
            }}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-600">{selectedProject.description || 'Aucune description'}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
            <Calendar className="w-4 h-4" />
            <span>
              {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('fr-FR') : 'Date non définie'}
              {selectedProject.end_date && ` - ${new Date(selectedProject.end_date).toLocaleDateString('fr-FR')}`}
            </span>
          </div>
          <p className="text-slate-500 mt-6">Fonctionnalité des itinéraires à venir...</p>
        </div>
      </main>
    </div>
  );
};

export default TravelPlannerApp;