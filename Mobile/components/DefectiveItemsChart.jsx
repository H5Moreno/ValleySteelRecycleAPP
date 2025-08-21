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
          fontSize: 18,
          fontWeight: 'bold',
          color: COLORS.text,
          marginBottom: 8,
          textAlign: 'center'
        }}>
          Defective Items Analysis
        </Text>
        <Text style={{
          fontSize: 14,
          color: COLORS.textLight,
          marginBottom: 16,
          textAlign: 'center'
        }}>
          Car Operators & Truck/Trailer Drivers
        </Text>
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

  // Separate car and truck/trailer items for summary
  const carItems = data.filter(item => item.type === 'car' || !item.type);
  const truckItems = data.filter(item => item.type === 'truck/trailer');

  // Fallback colors in case COLORS.secondary is undefined
  const primaryColor = COLORS.primary || "#0277BD";
  const secondaryColor = COLORS.secondary || "#FF7043"; // Orange fallback

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
        marginBottom: 4,
        textAlign: 'center'
      }}>
        Defective Items Analysis
      </Text>
      <Text style={{
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 16,
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Combined: Car Operators & Truck/Trailer Drivers
      </Text>

      {/* Legend */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        flexWrap: 'wrap'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 8,
          marginVertical: 4
        }}>
          <View style={{
            width: 12,
            height: 12,
            backgroundColor: primaryColor,
            borderRadius: 6,
            marginRight: 6
          }} />
          <Text style={{
            fontSize: 12,
            color: COLORS.text,
            fontWeight: '500'
          }}>
            Car Items ({carItems.length})
          </Text>
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 8,
          marginVertical: 4
        }}>
          <View style={{
            width: 12,
            height: 12,
            backgroundColor: secondaryColor,
            borderRadius: 6,
            marginRight: 6
          }} />
          <Text style={{
            fontSize: 12,
            color: COLORS.text,
            fontWeight: '500'
          }}>
            Truck/Trailer ({truckItems.length})
          </Text>
        </View>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: maxBarHeight + 80,
          paddingHorizontal: 10,
          minWidth: screenWidth - 64
        }}>
          {topItems.map((item, index) => {
            const barHeight = Math.max((item.count / maxCount) * maxBarHeight, 20);
            const barWidth = Math.max((screenWidth - 120) / Math.min(topItems.length, 8), 60);
            
            // Determine bar color with fallback
            const barColor = item.type === 'truck/trailer' ? secondaryColor : primaryColor;
            
            return (
              <View key={index} style={{
                alignItems: 'center',
                marginHorizontal: 2,
                width: barWidth
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

                {/* Type indicator */}
                <Text style={{
                  fontSize: 8,
                  fontWeight: 'bold',
                  color: barColor,
                  marginBottom: 4
                }}>
                  {item.type === 'truck/trailer' ? 'T/T' : 'CAR'}
                </Text>
                
                {/* Bar */}
                <View style={{
                  width: barWidth - 10,
                  height: barHeight,
                  backgroundColor: barColor,
                  borderRadius: 4,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: item.type === 'truck/trailer' ? '#FF5722' : '#0288D1'
                }} />
                
                {/* Item label */}
                <Text style={{
                  fontSize: 10,
                  color: COLORS.text,
                  textAlign: 'center',
                  width: barWidth,
                  lineHeight: 12,
                  height: 24, // Fixed height for consistent alignment
                  textAlignVertical: 'top' // Align text to top of container
                }} numberOfLines={2}>
                  {formatLabel(item.label)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      
      {/* Summary Statistics */}
      <View style={{
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: COLORS.text,
          marginBottom: 12,
          textAlign: 'center'
        }}>
          Summary
        </Text>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 16
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: COLORS.text
            }}>
              {data.length}
            </Text>
            <Text style={{
              fontSize: 12,
              color: COLORS.textLight,
              marginTop: 4
            }}>
              Total Items
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: primaryColor
            }}>
              {carItems.length}
            </Text>
            <Text style={{
              fontSize: 12,
              color: COLORS.textLight,
              marginTop: 4
            }}>
              Car Items
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: secondaryColor
            }}>
              {truckItems.length}
            </Text>
            <Text style={{
              fontSize: 12,
              color: COLORS.textLight,
              marginTop: 4
            }}>
              Truck/Trailer
            </Text>
          </View>
        </View>
      </View>

      {/* Top Issues List */}
      <View style={{
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
      }}>
        <Text style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: COLORS.text,
          marginBottom: 12
        }}>
          Top 5 Most Common Issues:
        </Text>
        {topItems.slice(0, 5).map((item, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.background
          }}>
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: primaryColor,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: COLORS.white
              }}>
                {index + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: COLORS.text,
                marginBottom: 2
              }}>
                {item.label}
              </Text>
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: item.type === 'truck/trailer' ? secondaryColor : primaryColor
              }}>
                {item.type === 'truck/trailer' ? 'Truck/Trailer' : 'Car'} • {item.count} occurrences
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// Helper function to format labels
const formatLabel = (label) => {
  if (label.length > 12) {
    const words = label.split(' ');
    if (words.length > 1) {
      // For multi-word labels, try to break evenly
      if (words.length === 2) {
        // For two words, put each on its own line
        return words[0] + '\n' + words[1];
      } else {
        // For more than two words, split roughly in half
        const mid = Math.ceil(words.length / 2);
        return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
      }
    }
    // For single long words, truncate
    return label.length > 12 ? label.substring(0, 10) + '...' : label;
  }
  // For short labels, add padding line to maintain consistent height
  return label + '\n ';
};

export default DefectiveItemsChart;