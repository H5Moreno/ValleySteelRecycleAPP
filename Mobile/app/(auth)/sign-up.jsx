import {useState} from 'react'
import { Text, TextInput, TouchableOpacity, View, } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import {styles} from "@/assets/styles/auth.styles.js"
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from "@/constants/colors.js";
import { Image } from 'expo-image'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        setError("Email address already exists. Please try another one.")
      } else {
        setError("Passwords must be at least 8 characters long")
      }
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.verificationContainer}>
        {/* Header with back button - positioned at top left */}
        <View style={styles.verificationHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              setPendingVerification(false);
              setCode('');
              setError('');
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Main content centered */}
        <KeyboardAwareScrollView 
          contentContainerStyle={styles.verificationScrollContent}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Verify your email</Text>
            <Text style={styles.verificationSubtitle}>
              We've sent a verification code to{'\n'}
              <Text style={styles.emailText}>{emailAddress}</Text>
            </Text>

            {error ? (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => setError('')}>
                        <Ionicons name="close" size={20} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>
            ) : null}

            <TextInput
              style={[styles.verificationInput, error && styles.errorInput]}
              value={code}
              placeholder="000000"
              placeholderTextColor={COLORS.textLight}
              onChangeText={(code) => setCode(code)}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />
            
            <TouchableOpacity onPress={onVerifyPress} style={styles.verifyButton}>
              <Text style={styles.buttonText}>Verify Email</Text>
            </TouchableOpacity>

            {/* Help section */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Didn't receive the code?
              </Text>
              <Text style={styles.helpSubText}>
                Check your spam folder or go back to try a different email address.
              </Text>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    )
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={30}
    >
        <View style={styles.container}>
        <Image 
          source={require("../../assets/images/VSR.png")} 
          style={[styles.illustration, { alignSelf: "center" }]} 
        />

        <Text style={styles.title}>Create Account</Text>

        {error ? (
            <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')}>
                    <Ionicons name="close" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
            </View>
        ) : null}
        
        <TextInput
          style={[styles.input, error && styles.errorInput]}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          placeholderTextColor={COLORS.textLight}
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />
        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={password}
          placeholder="Enter password"
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
        <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity> 
            </View>
        </View>
    </KeyboardAwareScrollView>
  )
}