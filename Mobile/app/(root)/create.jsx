import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Modal, Keyboard, KeyboardAvoidingView } from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from "../../assets/styles/create.styles";
import { COLORS } from "../../constants/colors";
import { API_URL } from "../../constants/api";
import { DEFECTIVE_ITEMS, TRUCK_TRAILER_ITEMS } from "../../constants/inspectionItems";
import { useAdmin } from "../../hooks/useAdmin";

const CreateInspectionScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is admin/mechanic
  const { isAdmin } = useAdmin(user?.id, user?.emailAddresses?.[0]?.emailAddress);
  
  // Create refs for ScrollView and signature inputs
  const scrollViewRef = useRef(null);
  const driverSignatureRef = useRef(null);
  const mechanicSignatureRef = useRef(null);

  // Form state
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [speedometerReading, setSpeedometerReading] = useState("");
  const [trailerNumber, setTrailerNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [conditionSatisfactory, setConditionSatisfactory] = useState(true);
  const [defectsCorrected, setDefectsCorrected] = useState(false);
  const [defectsNeedCorrection, setDefectsNeedCorrection] = useState(false);
  const [driverSignature, setDriverSignature] = useState("");
  const [mechanicSignature, setMechanicSignature] = useState("");

  // Defective items state
  const [selectedDefectiveItems, setSelectedDefectiveItems] = useState({});
  const [selectedTruckTrailerItems, setSelectedTruckTrailerItems] = useState({});

  const toggleDefectiveItem = (itemId) => {
    setSelectedDefectiveItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleTruckTrailerItem = (itemId) => {
    setSelectedTruckTrailerItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 🔧 KEYBOARD HANDLING FUNCTIONS
  const scrollToInput = (inputRef) => {
    setTimeout(() => {
      inputRef.current?.measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current?.scrollTo({
            y: y + height + 50, // Add extra padding
            animated: true,
          });
        },
        () => {}
      );
    }, 100);
  };

  const handleDriverSignatureFocus = () => {
    scrollToInput(driverSignatureRef);
  };

  const handleMechanicSignatureFocus = () => {
    scrollToInput(mechanicSignatureRef);
  };

  // 🔧 DATE PICKER FUNCTIONS
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    
    // Close the picker after selection on Android
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    setDate(currentDate);
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  // 🔧 TIME PICKER FUNCTIONS
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    
    // Close the picker after selection on Android
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    setTime(currentTime);
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const closeTimePicker = () => {
    setShowTimePicker(false);
  };

  const formatDateForDisplay = (dateObj) => {
    return dateObj.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
  };

  const formatTimeForDisplay = (timeObj) => {
    return timeObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimeForAPI = (timeObj) => {
    return timeObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleCreate = async () => {
    try {
      setIsLoading(true);

      if (!vehicle.trim()) {
        Alert.alert("Error", "Please enter a vehicle identifier");
        return;
      }

      const inspectionData = {
        user_id: user.id,
        user_email: user.emailAddresses?.[0]?.emailAddress || `${user.id}@clerk.user`,
        location: location.trim(),
        date: formatDateForDisplay(date), // 🔧 FORMAT DATE FOR API
        time: formatTimeForAPI(time), // 🔧 FORMAT TIME FOR API
        vehicle: vehicle.trim(),
        speedometer_reading: speedometerReading.trim(),
        defective_items: selectedDefectiveItems,
        truck_trailer_items: selectedTruckTrailerItems,
        trailer_number: trailerNumber.trim(),
        remarks: remarks.trim(),
        condition_satisfactory: conditionSatisfactory,
        driver_signature: driverSignature.trim(),
        defects_corrected: defectsCorrected,
        defects_need_correction: defectsNeedCorrection,
        // Only include mechanic signature if user is admin/mechanic
        mechanic_signature: isAdmin ? mechanicSignature.trim() : ""
      };

      const response = await fetch(`${API_URL}/inspections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inspectionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.error || "Failed to create inspection");
      }

      Alert.alert("Success", "Vehicle inspection created successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create inspection");
      console.error("Error creating inspection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Inspection</Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? "Saving..." : "Save"}</Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.card}>
          {/* BASIC INFO */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.text} /> Basic Information
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor={COLORS.textLight}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={showDatePickerModal}
              >
                <Text style={[styles.datePickerText, { color: date ? COLORS.text : COLORS.textLight }]}>
                  {formatDateForDisplay(date)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
              <Ionicons name="time-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={showTimePickerModal}
              >
                <Text style={[styles.datePickerText, { color: time ? COLORS.text : COLORS.textLight }]}>
                  {formatTimeForDisplay(time)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="car-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Vehicle *"
              placeholderTextColor={COLORS.textLight}
              value={vehicle}
              onChangeText={setVehicle}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="speedometer-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Speedometer Reading"
              placeholderTextColor={COLORS.textLight}
              value={speedometerReading}
              onChangeText={setSpeedometerReading}
              keyboardType="numeric"
            />
          </View>

          {/* DEFECTIVE ITEMS */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="warning-outline" size={16} color={COLORS.text} /> Defective Items Check
          </Text>
          <Text style={styles.sectionSubtitle}>Check any defective item and give details under "Remarks"</Text>

          <View style={styles.checkboxGrid}>
            {DEFECTIVE_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checkboxItem,
                  selectedDefectiveItems[item.id] && styles.checkboxItemSelected,
                ]}
                onPress={() => toggleDefectiveItem(item.id)}
              >
                <Ionicons
                  name={selectedDefectiveItems[item.id] ? "checkbox" : "square-outline"}
                  size={20}
                  color={selectedDefectiveItems[item.id] ? COLORS.primary : COLORS.textLight}
                />
                <Text style={[
                  styles.checkboxText,
                  selectedDefectiveItems[item.id] && styles.checkboxTextSelected,
                  item.asterisk && styles.checkboxTextAsterisk
                ]}>
                  {item.asterisk ? "* " : ""}{item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TRUCK/TRAILER SECTION */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="bus-outline" size={16} color={COLORS.text} /> Truck/Trailer Items
          </Text>
          <Text style={styles.sectionSubtitle}>This section to be filled out by truck/trailer drivers only</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="pricetag-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Trailer Number"
              placeholderTextColor={COLORS.textLight}
              value={trailerNumber}
              onChangeText={setTrailerNumber}
            />
          </View>

          <View style={styles.checkboxGrid}>
            {TRUCK_TRAILER_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checkboxItem,
                  selectedTruckTrailerItems[item.id] && styles.checkboxItemSelected,
                ]}
                onPress={() => toggleTruckTrailerItem(item.id)}
              >
                <Ionicons
                  name={selectedTruckTrailerItems[item.id] ? "checkbox" : "square-outline"}
                  size={20}
                  color={selectedTruckTrailerItems[item.id] ? COLORS.primary : COLORS.textLight}
                />
                <Text style={[
                  styles.checkboxText,
                  selectedTruckTrailerItems[item.id] && styles.checkboxTextSelected
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* REMARKS */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.text} /> Remarks
          </Text>

          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Enter any remarks or details about defective items..."
              placeholderTextColor={COLORS.textLight}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* CONDITION STATUS */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.text} /> Vehicle Condition
          </Text>

          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => setConditionSatisfactory(true)}
          >
            <Ionicons
              name={conditionSatisfactory ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.radioText}>Condition of above vehicle(s) is/are satisfactory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => setConditionSatisfactory(false)}
          >
            <Ionicons
              name={!conditionSatisfactory ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.radioText}>Condition is not satisfactory</Text>
          </TouchableOpacity>

          {/* SIGNATURES */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="create-outline" size={16} color={COLORS.text} /> Signatures
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              ref={driverSignatureRef}
              style={styles.input}
              placeholder="Driver's Signature"
              placeholderTextColor={COLORS.textLight}
              value={driverSignature}
              onChangeText={setDriverSignature}
              onFocus={handleDriverSignatureFocus}
              returnKeyType={isAdmin ? "next" : "done"}
              onSubmitEditing={() => {
                if (isAdmin) {
                  mechanicSignatureRef.current?.focus();
                } else {
                  Keyboard.dismiss();
                }
              }}
            />
          </View>

          {/* DEFECTS CORRECTION */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setDefectsCorrected(!defectsCorrected)}
          >
            <Ionicons
              name={defectsCorrected ? "checkbox" : "square-outline"}
              size={20}
              color={defectsCorrected ? COLORS.primary : COLORS.textLight}
            />
            <Text style={styles.checkboxText}>Above defects corrected</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setDefectsNeedCorrection(!defectsNeedCorrection)}
          >
            <Ionicons
              name={defectsNeedCorrection ? "checkbox" : "square-outline"}
              size={20}
              color={defectsNeedCorrection ? COLORS.primary : COLORS.textLight}
            />
            <Text style={styles.checkboxText}>Above defects need not be corrected for safe operation of vehicle</Text>
          </TouchableOpacity>

          {/* Mechanic signature - only available for admins/mechanics */}
          {isAdmin && (
            <View style={styles.inputContainer}>
              <Ionicons name="construct-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                ref={mechanicSignatureRef}
                style={styles.input}
                placeholder="Mechanic's Signature"
                placeholderTextColor={COLORS.textLight}
                value={mechanicSignature}
                onChangeText={setMechanicSignature}
                onFocus={handleMechanicSignatureFocus}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          )}

          {/* Info message for regular users */}
          {!isAdmin && (
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.infoText}>
                Mechanic signature can only be added by authorized mechanics or administrators.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* 🔧 ENHANCED DATE PICKER MODAL */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={closeDatePicker}
        >
          <TouchableOpacity 
            style={styles.datePickerOverlay}
            activeOpacity={1}
            onPress={closeDatePicker}
          >
            <View style={styles.datePickerContainer}>
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={closeDatePicker}>
                    <Ionicons name="close" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.datePickerContent}>
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode="date"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    themeVariant="light"
                    style={styles.datePickerStyle}
                  />
                </View>
                
                {Platform.OS === 'ios' && (
                  <View style={styles.datePickerActions}>
                    <TouchableOpacity 
                      style={styles.datePickerActionButton}
                      onPress={closeDatePicker}
                    >
                      <Text style={styles.datePickerButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 🔧 ENHANCED TIME PICKER MODAL */}
      {showTimePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showTimePicker}
          onRequestClose={closeTimePicker}
        >
          <TouchableOpacity 
            style={styles.datePickerOverlay}
            activeOpacity={1}
            onPress={closeTimePicker}
          >
            <View style={styles.datePickerContainer}>
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={closeTimePicker}>
                    <Ionicons name="close" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.datePickerContent}>
                  <DateTimePicker
                    testID="timeTimePicker"
                    value={time}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                    themeVariant="light"
                    style={styles.datePickerStyle}
                  />
                </View>
                
                {Platform.OS === 'ios' && (
                  <View style={styles.datePickerActions}>
                    <TouchableOpacity 
                      style={styles.datePickerActionButton}
                      onPress={closeTimePicker}
                    >
                      <Text style={styles.datePickerButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

export default CreateInspectionScreen;