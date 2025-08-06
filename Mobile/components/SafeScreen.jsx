import { View, Text } from 'react-native'
import React from 'react'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from "@/constants/colors.js";

const SafeScreen = ({children}) => {
  const insts = useSafeAreaInsets();
  return (
    <View style={{paddingTop:insts.top, flex: 1, backgroundColor:COLORS.background}}>
        {children}
    </View>
  )
}

export default SafeScreen