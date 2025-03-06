"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "es" | "fr" | "de"

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    "home.title": "Discover Events",
    "home.subtitle": "Find and book tickets for the best events near you",
    "event.buyTicket": "Buy Ticket",
    "event.date": "Date",
    "event.location": "Location",
    "event.price": "Price",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "checkout.summary": "Order Summary",
    "checkout.pay": "Pay Now",
    // Add more translations as needed
  },
  es: {
    "home.title": "Descubrir Eventos",
    "home.subtitle": "Encuentra y reserva entradas para los mejores eventos cerca de ti",
    "event.buyTicket": "Comprar Entrada",
    "event.date": "Fecha",
    "event.location": "Ubicación",
    "event.price": "Precio",
    "auth.login": "Iniciar Sesión",
    "auth.register": "Registrarse",
    "auth.email": "Correo Electrónico",
    "auth.password": "Contraseña",
    "checkout.summary": "Resumen del Pedido",
    "checkout.pay": "Pagar Ahora",
    // Add more translations as needed
  },
  fr: {
    "home.title": "Découvrir des Événements",
    "home.subtitle": "Trouvez et réservez des billets pour les meilleurs événements près de chez vous",
    "event.buyTicket": "Acheter un Billet",
    "event.date": "Date",
    "event.location": "Lieu",
    "event.price": "Prix",
    "auth.login": "Connexion",
    "auth.register": "S'inscrire",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "checkout.summary": "Récapitulatif de la Commande",
    "checkout.pay": "Payer Maintenant",
    // Add more translations as needed
  },
  de: {
    "home.title": "Veranstaltungen Entdecken",
    "home.subtitle": "Finden und buchen Sie Tickets für die besten Veranstaltungen in Ihrer Nähe",
    "event.buyTicket": "Ticket Kaufen",
    "event.date": "Datum",
    "event.location": "Ort",
    "event.price": "Preis",
    "auth.login": "Anmelden",
    "auth.register": "Registrieren",
    "auth.email": "E-Mail",
    "auth.password": "Passwort",
    "checkout.summary": "Bestellübersicht",
    "checkout.pay": "Jetzt Bezahlen",
    // Add more translations as needed
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "es", "fr", "de"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  const t = (key: string) => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

