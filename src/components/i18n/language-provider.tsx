"use client";

import type React from "react";

import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

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
  ar: {
    "home.title": "Descubrir Eventos",
    "home.subtitle":
      "Encuentra y reserva entradas para los mejores eventos cerca de ti",
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
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && ["en", "es", "fr", "de"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string) => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
