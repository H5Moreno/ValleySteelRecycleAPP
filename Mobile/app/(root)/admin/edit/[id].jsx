import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Modal, Keyboard, KeyboardAvoidingView } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from "../../../../assets/styles/create.styles";
import { COLORS } from "../../../../constants/colors";
import { API_URL } from "../../../../constants/api"; 
import { DEFECTIVE_ITEMS, TRUCK_TRAILER_ITEMS } from "../../../../constants/inspectionItems";
import { useAdmin } from "../../../../hooks/useAdmin";
import PageLoader from "../../../../components/PageLoader";

const EditInspectionScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const { allInspections, updateInspection, isLoading: adminLoading, isAdmin } = useAdmin(user.id, user?.emailAddresses?.[0]?.emailAddress);
  
  const [isLoading, setIsLoading] = useState(false);
  const [inspection, setInspection] = useState(null);

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
  
  // 🔧 SEPARATE ADMIN-ONLY CONDITION STATUS MANAGEMENT
  const [originalConditionSatisfactory, setOriginalConditionSatisfactory] = useState(true);
  const [conditionSatisfactory, setConditionSatisfactory] = useState(true);
  const [conditionStatusChanged, setConditionStatusChanged] = useState(false);
  
  const [defectsCorrected, setDefectsCorrected] = useState(false);
  const [defectsNeedCorrection, setDefectsNeedCorrection] = useState(false);
  const [driverSignature, setDriverSignature] = useState("");
  const [mechanicSignature, setMechanicSignature] = useState("");

  // Defective items state
  const [selectedDefectiveItems, setSelectedDefectiveItems] = useState({});
  const [selectedTruckTrailerItems, setSelectedTruckTrailerItems] = useState({});

  // 🔧 ADMIN-ONLY FUNCTION TO HANDLE CONDITION STATUS CHANGES
  const handleConditionStatusChange = (newStatus) => {
    if (!isAdmin) {
      Alert.alert(
        "Access Denied", 
        "Only administrators can modify the vehicle condition status.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setConditionSatisfactory(newStatus);
    setConditionStatusChanged(newStatus !== originalConditionSatisfactory);
  };

  // Load inspection data
  useEffect(() => {
    if (!adminLoading && allInspections.length > 0) {
      const foundInspection = allInspections.find(inspection => 
        inspection.id.toString() === id.toString()
      );
      
      if (foundInspection) {
        setInspection(foundInspection);
        
        // Populate form fields
        setLocation(foundInspection.location || "");
        
        // 🔧 HANDLE DATE CONVERSION FOR DATE PICKER
        if (foundInspection.date) {
          try {
            const inspectionDate = new Date(foundInspection.date);
            setDate(isNaN(inspectionDate.getTime()) ? new Date() : inspectionDate);
          } catch (error) {
            console.error('Error parsing date:', error);
            setDate(new Date());
          }
        } else {
          setDate(new Date());
        }
        
        // 🔧 HANDLE TIME CONVERSION FOR TIME PICKER
        if (foundInspection.time) {
          try {
            // Parse time string (e.g., "14:30" or "2:30 PM") into Date object
            const timeStr = foundInspection.time.trim();
            const timeDate = new Date();
            
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
              // Parse 12-hour format
              const [timePart, period] = timeStr.split(/\s+(AM|PM)/i);
              const [hours, minutes] = timePart.split(':').map(Number);
              let hour24 = hours;
              
              if (period.toUpperCase() === 'PM' && hours !== 12) {
                hour24 += 12;
              } else if (period.toUpperCase() === 'AM' && hours === 12) {
                hour24 = 0;
              }
              
              timeDate.setHours(hour24, minutes || 0, 0, 0);
            } else {
              // Parse 24-hour format
              const [hours, minutes] = timeStr.split(':').map(Number);
              timeDate.setHours(hours || 0, minutes || 0, 0, 0);
            }
            
            setTime(timeDate);
          } catch (error) {
            console.error('Error parsing time:', error);
            setTime(new Date());
          }
        } else {
          setTime(new Date());
        }
        
        setVehicle(foundInspection.vehicle || "");
        setSpeedometerReading(foundInspection.speedometer_reading || "");
        setTrailerNumber(foundInspection.trailer_number || "");
        setRemarks(foundInspection.remarks || "");
        
        // 🔧 PRESERVE ORIGINAL CONDITION STATUS
        const originalStatus = foundInspection.condition_satisfactory || false;
        setOriginalConditionSatisfactory(originalStatus);
        setConditionSatisfactory(originalStatus);
        setConditionStatusChanged(false);
        
        setDefectsCorrected(foundInspection.defects_corrected || false);
        setDefectsNeedCorrection(foundInspection.defects_need_correction || false);
        setDriverSignature(foundInspection.driver_signature || "");
        setMechanicSignature(foundInspection.mechanic_signature || "");
        
        // Parse JSON fields
        try {
          const defectiveItems = typeof foundInspection.defective_items === 'string' 
            ? JSON.parse(foundInspection.defective_items) 
            : foundInspection.defective_items || {};
          const truckTrailerItems = typeof foundInspection.truck_trailer_items === 'string'
            ? JSON.parse(foundInspection.truck_trailer_items)
            : foundInspection.truck_trailer_items || {};
          
          setSelectedDefectiveItems(defectiveItems);
          setSelectedTruckTrailerItems(truckTrailerItems);
        } catch (error) {
          console.error('Error parsing JSON fields:', error);
          setSelectedDefectiveItems({});
          setSelectedTruckTrailerItems({});
        }
      }
    }
  }, [id, allInspections, adminLoading]);

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

  // Remove the renderUserManagement function - it doesn't belong here

  const handleUpdate = async () => {
    try {
      setIsLoading(true);

      if (!vehicle.trim()) {
        Alert.alert("Error", "Please enter a vehicle identifier");
        return;
      }

      console.log('=== UPDATING INSPECTION ===');
      console.log('Inspection ID:', id);
      console.log('Admin User ID:', user.id);
      console.log('Is Admin:', isAdmin);
      console.log('Condition Status Changed:', conditionStatusChanged);
      console.log('Original Condition:', originalConditionSatisfactory);
      console.log('Current Condition:', conditionSatisfactory);

      const updateData = {
        location: location.trim(),
        date: formatDateForDisplay(date), // 🔧 FORMAT DATE FOR API
        time: formatTimeForAPI(time), // 🔧 FORMAT TIME FOR API
        vehicle: vehicle.trim(),
        speedometer_reading: speedometerReading.trim(),
        defective_items: selectedDefectiveItems,
        truck_trailer_items: selectedTruckTrailerItems,
        trailer_number: trailerNumber.trim(),
        remarks: remarks.trim(),
        driver_signature: driverSignature.trim(),
        defects_corrected: defectsCorrected,
        defects_need_correction: defectsNeedCorrection,
        mechanic_signature: mechanicSignature.trim(),
        adminUserId: user.id
      };

      // 🔧 ONLY INCLUDE CONDITION STATUS IF ADMIN EXPLICITLY CHANGED IT
      if (isAdmin && conditionStatusChanged) {
        updateData.condition_satisfactory = conditionSatisfactory;
        console.log('✅ Admin condition status change included:', conditionSatisfactory);
      } else {
        console.log('🚫 Condition status NOT updated - either not admin or not changed');
      }

      console.log('Update data being sent:', updateData);

      const response = await fetch(`${API_URL}/admin/inspections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Update successful:', result);

      const successMessage = conditionStatusChanged && isAdmin 
        ? "Inspection updated successfully (including condition status)" 
        : "Inspection updated successfully";

      Alert.alert("Success", successMessage, [
        { text: "OK", onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error("Error updating inspection:", error);
      Alert.alert("Error", `Failed to update inspection: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (adminLoading || !inspection) return <PageLoader />;

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
        <Text style={styles.headerTitle}>Edit Inspection</Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleUpdate}
          disabled={isLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? "Updating..." : "Update"}</Text>
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

          {/* CONDITION STATUS - ADMIN ONLY */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.text} /> Vehicle Condition
            {!isAdmin && <Text style={[styles.sectionSubtitle, { color: COLORS.expense }]}> (Admin Only)</Text>}
          </Text>

          {!isAdmin && (
            <View style={[styles.adminWarningContainer, { backgroundColor: COLORS.border, padding: 10, borderRadius: 8, marginBottom: 15 }]}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.expense} />
              <Text style={[styles.adminWarningText, { color: COLORS.expense, marginLeft: 8, flex: 1 }]}>
                Only administrators can modify the vehicle condition status. Current status is preserved.
              </Text>
            </View>
          )}

          {conditionStatusChanged && isAdmin && (
            <View style={[styles.changeIndicator, { backgroundColor: COLORS.secondary, padding: 8, borderRadius: 6, marginBottom: 10 }]}>
              <Ionicons name="warning-outline" size={16} color={COLORS.white} />
              <Text style={[styles.changeIndicatorText, { color: COLORS.white, marginLeft: 8, fontSize: 14 }]}>
                Condition status will be updated to: {conditionSatisfactory ? "Satisfactory" : "Unsatisfactory"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.radioContainer,
              !isAdmin && { opacity: 0.6 }
            ]}
            onPress={() => handleConditionStatusChange(true)}
            disabled={!isAdmin}
          >
            <Ionicons
              name={conditionSatisfactory ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={isAdmin ? COLORS.primary : COLORS.textLight}
            />
            <Text style={[
              styles.radioText,
              !isAdmin && { color: COLORS.textLight }
            ]}>
              Condition of above vehicle(s) is/are satisfactory
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioContainer,
              !isAdmin && { opacity: 0.6 }
            ]}
            onPress={() => handleConditionStatusChange(false)}
            disabled={!isAdmin}
          >
            <Ionicons
              name={!conditionSatisfactory ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={isAdmin ? COLORS.primary : COLORS.textLight}
            />
            <Text style={[
              styles.radioText,
              !isAdmin && { color: COLORS.textLight }
            ]}>
              Condition is not satisfactory
            </Text>
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
              returnKeyType="next"
              onSubmitEditing={() => mechanicSignatureRef.current?.focus()}
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

          {/* Admin Info */}
          <View style={styles.adminInfoContainer}>
            <Text style={styles.adminInfoText}>
              <Ionicons name="person-outline" size={12} color={COLORS.textLight} /> Original User: {inspection.user_email || inspection.user_id}
            </Text>
            <Text style={styles.adminInfoText}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textLight} /> Created: {new Date(inspection.created_at).toLocaleString()}
            </Text>
            {inspection.updated_at && (
              <Text style={styles.adminInfoText}>
                <Ionicons name="time-outline" size={12} color={COLORS.textLight} /> Last Updated: {new Date(inspection.updated_at).toLocaleString()}
              </Text>
            )}
          </View>
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

export default EditInspectionScreen;