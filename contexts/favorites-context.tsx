'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface FavoriteItem {
  id: string
  name: string
  slug: string
  price: number
  image?: string
}

interface FavoritesContextType {
  favorites: FavoriteItem[]
  addFavorite: (item: FavoriteItem) => void
  removeFavorite: (id: string) => void
  toggleFavorite: (item: FavoriteItem) => void
  isFavorite: (id: string) => boolean
  favoritesCount: number
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('ejg-favorites')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch {
        setFavorites([])
      }
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('ejg-favorites', JSON.stringify(favorites))
    }
  }, [favorites, mounted])

  const addFavorite = (item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.find((f) => f.id === item.id)) {
        return prev
      }
      return [...prev, item]
    })
  }

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id))
  }

  const toggleFavorite = (item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === item.id)
      if (exists) {
        return prev.filter((f) => f.id !== item.id)
      }
      return [...prev, item]
    })
  }

  const isFavorite = (id: string) => {
    return favorites.some((f) => f.id === id)
  }

  const favoritesCount = favorites.length

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        favoritesCount,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
