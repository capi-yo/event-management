"use client"

import * as React from "react"
import { useEffect } from "react"

type Theme = "light" | "dark"

function ThemeProvider({ children, defaultTheme = "light" }: { children: React.ReactNode; defaultTheme?: Theme }) {
    const [theme, setTheme] = React.useState<Theme>(defaultTheme)

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"))
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

const ThemeContext = React.createContext<{ theme: Theme; toggleTheme: () => void }>({
    theme: "light",
    toggleTheme: () => { },
})

export function useTheme() {
    return React.useContext(ThemeContext)
}

export { ThemeProvider }
