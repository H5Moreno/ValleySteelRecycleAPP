import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';

const screenWidth = Dimensions.get('window').width;

const DefectiveItemsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        margin: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={{
          fontSize: 16,
          color: COLORS.textLight,
          textAlign: 'center'
        }}>
          No defective items data available
        </Text>
      </View>
    );
  }

  // Get the maximum count to scale the bars
  const maxCount = Math.max(...data.map(item => item.count));
  const maxBarHeight = 150;

  // Take top 8 items to fit on screen
  const topItems = data.slice(0, 8);

  return (
    <View style={{
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
        textAlign: 'center'
      }}>
        Most Common Defective Items
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: maxBarHeight + 60,
          paddingHorizontal: 10,
          minWidth: screenWidth - 64
        }}>
          {topItems.map((item, index) => {
            const barHeight = (item.count / maxCount) * maxBarHeight;
            const barWidth = (screenWidth - 120) / Math.min(topItems.length, 6);
            
            return (
              <View key={index} style={{
                alignItems: 'center',
                marginHorizontal: 4,
                width: Math.max(barWidth, 60)
              }}>
                {/* Count label on top of bar */}
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: COLORS.text,
                  marginBottom: 4
                }}>
                  {item.count}
                </Text>
                
                {/* Bar */}
                <View style={{
                  width: Math.max(barWidth - 10, 35),
                  height: Math.max(barHeight, 20),
                  backgroundColor: getBarColor(index),
                  borderRadius: 4,
                  marginBottom: 8
                }} />
                
                {/* Item label */}
                <Text style={{
                  fontSize: 10,
                  color: COLORS.text,
                  textAlign: 'center',
                  width: Math.max(barWidth, 60),
                  numberOfLines: 2
                }}>
                  {formatLabel(item.label)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      
      {/* Summary */}
      <View style={{ 
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
      }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: COLORS.text,
          marginBottom: 8
        }}>
          Summary (Top {topItems.length} items):
        </Text>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}>
          {topItems.map((item, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 16,
              marginBottom: 4,
              width: '45%'
            }}>
              <View style={{
                width: 12,
                height: 12,
                backgroundColor: getBarColor(index),
                borderRadius: 2,
                marginRight: 6
              }} />
              <Text style={{
                fontSize: 11,
                color: COLORS.textLight,
                flex: 1
              }}>
                {item.label}: {item.count}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Helper function to get different colors for bars
const getBarColor = (index) => {
  const colors = [
    '#3498db', // Blue
    '#2ecc71', // Green  
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Teal
    '#34495e', // Dark Gray
    '#95a5a6', // Light Gray
  ];
  return colors[index % colors.length];
};

// Helper function to format labels
const formatLabel = (label) => {
  // Split long labels into multiple lines
  if (label.length > 10) {
    const words = label.split(' ');
    if (words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
    }
    return label.length > 12 ? label.substring(0, 10) + '...' : label;
  }
  return label;
};

export default DefectiveItemsChart;