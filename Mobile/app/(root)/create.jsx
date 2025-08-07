import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../assets/styles/create.styles";
import { COLORS } from "../../constants/colors";
import { API_URL } from "../../constants/api";
import { DEFECTIVE_ITEMS, TRUCK_TRAILER_ITEMS } from "../../constants/inspectionItems";

const CreateInspectionScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("");
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

  const handleCreate = async () => {
    try {
      setIsLoading(true);

      if (!vehicle.trim()) {
        Alert.alert("Error", "Please enter a vehicle identifier");
        return;
      }

      const inspectionData = {
        user_id: user.id,
        location: location.trim(),
        date,
        time: time.trim(),
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
        mechanic_signature: mechanicSignature.trim()
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
    <View style={styles.container}>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={COLORS.textLight}
                value={date}
                onChangeText={setDate}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
              <Ionicons name="time-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Time"
                placeholderTextColor={COLORS.textLight}
                value={time}
                onChangeText={setTime}
              />
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
              style={styles.input}
              placeholder="Driver's Signature"
              placeholderTextColor={COLORS.textLight}
              value={driverSignature}
              onChangeText={setDriverSignature}
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
              style={styles.input}
              placeholder="Mechanic's Signature"
              placeholderTextColor={COLORS.textLight}
              value={mechanicSignature}
              onChangeText={setMechanicSignature}
            />
          </View>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
};

export default CreateInspectionScreen;