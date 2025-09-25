'use client';

import React, { useState } from 'react';
import { Plane, RefreshCw, Download, Settings, Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

interface NavbarProps {
  onGHLSync: () => void;
}

export function Navbar({ onGHLSync }: NavbarProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onGHLSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    // Logique d'export à implémenter
    console.log('Export des données...');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Travel Manager</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Gestion d'itinéraires</p>
            </div>
          </div>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              loading={isSyncing}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync GHL
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Menu mobile ouvert */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3">
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                loading={isSyncing}
                disabled={isSyncing}
                className="justify-start"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Synchroniser GHL
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter les données
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}