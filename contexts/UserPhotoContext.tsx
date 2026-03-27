"use client"

import { createContext, useContext, useState } from "react"

type UserPhotoContextType = {
  photoUrl: string | null
  setPhotoUrl: (url: string | null) => void
}

const UserPhotoContext = createContext<UserPhotoContextType>({
  photoUrl: null,
  setPhotoUrl: () => {},
})

export function UserPhotoProvider({
  initial,
  children,
}: {
  initial: string | null
  children: React.ReactNode
}) {
  const [photoUrl, setPhotoUrl] = useState(initial)
  return (
    <UserPhotoContext.Provider value={{ photoUrl, setPhotoUrl }}>
      {children}
    </UserPhotoContext.Provider>
  )
}

export function useUserPhoto() {
  return useContext(UserPhotoContext)
}
