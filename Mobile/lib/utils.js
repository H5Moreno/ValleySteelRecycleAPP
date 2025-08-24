export const formatDate = (dateString, language = 'en') => {
  if (!dateString) return language === 'es' ? "Sin fecha" : "No date";
  
  try {
    const date = new Date(dateString);
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    
    // Format options for Spanish vs English
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    return language === 'es' ? "Fecha inválida" : "Invalid date";
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};