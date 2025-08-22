import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default to English
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on app start
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = language === 'en' ? 'es' : 'en';
    setLanguage(newLanguage);
    
    try {
      await AsyncStorage.setItem('appLanguage', newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const setLanguageDirectly = async (lang) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem('appLanguage', lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        toggleLanguage, 
        setLanguage: setLanguageDirectly,
        isLoading 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
