import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS } from '../constants/colors';

const LanguageToggle = ({ style, showLabel = true, size = 'medium' }) => {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  
  const isSpanish = language === 'es';
  
  const toggleStyles = {
    small: {
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
      },
      text: {
        fontSize: 12,
        marginHorizontal: 4,
      },
      icon: 16,
    },
    medium: {
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
      },
      text: {
        fontSize: 14,
        marginHorizontal: 6,
      },
      icon: 18,
    },
    large: {
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginVertical: 8,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      text: {
        fontSize: 16,
        marginHorizontal: 8,
      },
      icon: 20,
    },
  };
  
  const currentStyle = toggleStyles[size];
  
  return (
    <TouchableOpacity 
      style={[currentStyle.container, style]} 
      onPress={toggleLanguage}
      activeOpacity={0.7}
    >
      {showLabel && (
        <Ionicons 
          name="language-outline" 
          size={currentStyle.icon} 
          color={COLORS.primary} 
        />
      )}
      
      <Text style={[
        currentStyle.text,
        { 
          color: isSpanish ? COLORS.textLight : COLORS.primary,
          fontWeight: isSpanish ? 'normal' : '600'
        }
      ]}>
        EN
      </Text>
      
      <Switch
        value={isSpanish}
        onValueChange={toggleLanguage}
        trackColor={{ 
          false: COLORS.border, 
          true: COLORS.primary + '40' 
        }}
        thumbColor={isSpanish ? COLORS.primary : COLORS.textLight}
        ios_backgroundColor={COLORS.border}
      />
      
      <Text style={[
        currentStyle.text,
        { 
          color: isSpanish ? COLORS.primary : COLORS.textLight,
          fontWeight: isSpanish ? '600' : 'normal'
        }
      ]}>
        ES
      </Text>
      
      {showLabel && size === 'large' && (
        <View style={{ marginLeft: 8 }}>
          <Text style={{
            fontSize: 12,
            color: COLORS.textLight,
            fontStyle: 'italic'
          }}>
            {t('language')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default LanguageToggle;
