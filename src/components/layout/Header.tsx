"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Menu, User, ChevronUp } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo y marca */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
          <NextImage src="/gob_iso.png" alt="Logo"  className="h-10 w-10" width={100} height={100} />
            <div className="hidden sm:block ml-2">
              <h1 className="font-rutan font-semibold text-xl text-foreground">
              Portal de servicios
              </h1>
              <p className="text-xs text-muted-foreground mt-[-5px]">
                Gobierno de la Ciudad de Ceres
              </p>
            </div>
          </Link>
        </div>

        {/* Barra de búsqueda - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(searchQuery.length > 0)}
              placeholder="Buscar servicios..."
              className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        <nav className="flex items-center space-x-4">
         

          {/* Botones de acción */}
          <div className="flex items-center justify-center space-x-2">
            {user? (
              <DropdownMenu onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger className="hidden sm:flex">
                    <User className="h-5 w-5 mr-1" />
                    Hola, {user.firstName || user.name || 'Usuario'}
                    {isOpen ? <ChevronUp className="h-5 w-5 ml-1" /> : <ChevronUp className="h-5 w-5 ml-1 rotate-180" />}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>
                    <span className="text-xs text-muted-foreground">{user.email} </span>

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
                    <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => logout()}>
                  Salir
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/auth/login">
                    <User className="h-4 w-4 mr-1" />
                    Ingresar
                  </Link>
                </Button>
                <Button size="sm" asChild className="bg-[var(--gov-green)] hover:bg-[var(--gov-green-dark)] text-white">
                  <Link href="/auth/registro">
                    Ofrecer Servicios
                  </Link>
                </Button>
              </>
            )}

            {/* Menú móvil */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>

      {/* Barra de búsqueda móvil */}
      <div className="md:hidden border-t p-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            placeholder="Buscar servicios..."
            className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <SearchSuggestions
            query={searchQuery}
            isVisible={showSuggestions}
            onSelect={handleSuggestionSelect}
            onClose={() => setShowSuggestions(false)}
          />
        </form>
      </div>
    </header>
  );
}
