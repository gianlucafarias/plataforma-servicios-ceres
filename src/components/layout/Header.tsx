"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Menu, User, X, LogOut, LayoutDashboard, ChevronDown, Settings } from "lucide-react";
import NextImage from "next/image";
import { useState } from "react";
import { SearchSuggestions } from "@/components/features/SearchSuggestions";
import { useAuth } from "@/hooks/useAuth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const { user, logout, profile } = useAuth();
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirigir a la página de servicios con la búsqueda
      window.location.href = `/servicios?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo y marca */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <NextImage src="/gob_iso.png" alt="Logo" className="h-10 w-10 flex-shrink-0" width={40} height={40} />
              <div className="hidden md:block leading-tight">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                 Ceres en Red
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gobierno de la Ciudad de Ceres
                </p>
              </div>
            </Link>
          </div>

          {/* Barra de búsqueda - Desktop */}
          <div className="hidden md:flex relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="text-lg" />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                placeholder="Buscar servicios..."
                className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full text-base bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white w-80 transition-all"
              />
              <SearchSuggestions
                query={searchQuery}
                isVisible={showSuggestions}
                onSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
              />
            </form>
          </div>

          {/* Navegación */}
          <div className="flex items-center gap-4">
            {/* Botón de búsqueda móvil */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* Desktop: Menú de usuario */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                    {(user.firstName || user.name || 'Usuario').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">Hola, {user.firstName || user.name || 'Usuario'}</span>
                  <ChevronDown className="text-base" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={async () => {
                    const profileData = await profile();
                    if (profileData) {
                      window.location.href = `/profesionales/${profileData.id}`;
                    }
                  }}>
                    Mi perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    window.location.href = '/dashboard';
                  }}>
                    Mi dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    window.location.href = '/dashboard/settings';
                  }}>
                    Ajustes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    Salir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link href="/auth/login">
                    <User className="h-4 w-4 mr-1" />
                    Ingresar
                  </Link>
                </Button>
                <Button size="sm" asChild className="hidden md:flex bg-amber-600 hover:bg-amber-500 text-white">
                  <Link href="/auth/registro">
                    Ofrecer Servicios
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile: Avatar del usuario (si está logueado) */}
            {user && (
              <div className="md:hidden">
                <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                  {(user.firstName || user.name || 'Usuario').charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            {/* Menú hamburguesa móvil */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda móvil (toggleable) */}
      {showMobileSearch && (
        <div className="md:hidden border-t p-4 bg-white dark:bg-gray-900">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(searchQuery.length > 0)}
              placeholder="Buscar servicios..."
              className="w-full rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-10 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all"
              autoFocus
            />
            <SearchSuggestions
              query={searchQuery}
              isVisible={showSuggestions}
              onSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
            />
          </form>
        </div>
      )}

      {/* Menú móvil desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-gray-900 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                {/* Información del usuario */}
                <div className="flex items-center gap-3 px-3 py-2 mb-3 border-b">
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                    {(user.firstName || user.name || 'Usuario').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {user.firstName || user.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Opciones del menú */}
                <button
                  onClick={async () => {
                    const profileData = await profile();
                    if (profileData) {
                      window.location.href = `/profesionales/${profileData.id}`;
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <User className="h-4 w-4" />
                  Mi perfil
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/dashboard';
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Mi dashboard
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/dashboard/settings';
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Ajustes
                </button>
                <div className="border-t my-2"></div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <User className="h-4 w-4" />
                  Ingresar
                </Link>
                <Link
                  href="/auth/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm bg-secondary text-white hover:bg-amber-600 rounded-md transition-colors"
                >
                  Ofrecer Servicios
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
