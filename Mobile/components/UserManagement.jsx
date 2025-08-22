import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { COLORS } from '../constants/colors';
import { API_URL } from '../constants/api';
import { useTranslation } from '../hooks/useTranslation';

const UserManagement = ({ adminUserId }) => {
  const { user } = useUser(); // Get current user info to access email
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [emailToPromote, setEmailToPromote] = useState('');
  const [promoting, setPromoting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${adminUserId}`);
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        console.error('Failed to fetch users');
        Alert.alert(t('error'), t('failedToLoadUsers'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert(t('error'), t('networkErrorUsers'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (adminUserId) {
      fetchUsers();
    }
  }, [adminUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleRoleChange = (userId, currentRole, userEmail) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? t('promoteToAdmin') : t('removeAdminPrivileges');
    
    Alert.alert(
      t('changeUserRole'),
      `${t('areYouSure')} ${actionText} ${t('forUser')} ${userEmail || t('thisUser')}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: () => updateUserRole(userId, newRole)
        }
      ]
    );
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUserId,
          newRole
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(t('success'), result.message || t('userRoleUpdated'));
        fetchUsers(); // Refresh the list
      } else {
        console.error('Update role error:', result);
        Alert.alert(t('error'), result.error || t('failedToUpdateRole'));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert(t('error'), t('networkErrorRole'));
    }
  };

  const promoteUserByEmail = async () => {
    if (!emailToPromote.trim()) {
      Alert.alert(t('error'), t('enterEmailAddress'));
      return;
    }

    setPromoting(true);
    try {
      console.log('Promoting user with email:', emailToPromote.trim());
      
      const response = await fetch(`${API_URL}/admin/promote-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: emailToPromote.trim().toLowerCase(),
          adminUserId
        }),
      });

      const result = await response.json();
      console.log('Promote response:', result);

      if (response.ok) {
        Alert.alert(t('success'), result.message || t('userPromotedSuccess'));
        setEmailToPromote('');
        setPromoteModalVisible(false);
        fetchUsers(); // Refresh the list
      } else {
        console.error('Promote error:', result);
        Alert.alert(t('error'), result.error || t('failedToPromote'));
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      Alert.alert(t('error'), t('networkErrorPromote'));
    } finally {
      setPromoting(false);
    }
  };

  const revealUserEmail = (userItem) => {
    const { id, email, role } = userItem;
    
    // Determine what to show
    let displayEmail = email || t('noEmailAvailable');
    let isTemporary = email && email.includes('@clerk.user');
    
    if (isTemporary) {
      displayEmail = `${t('temporary')}: ${email}`;
    }
    
    const userInfo = `${t('userId')}: ${id}\n${t('email')}: ${displayEmail}\n${t('role')}: ${role}`;
    
    Alert.alert(
      t('userInformation'),
      userInfo,
      [
        { text: 'OK' },
        ...(isTemporary && id === user?.id && user?.emailAddresses?.[0]?.emailAddress ? [{
          text: t('updateMyEmail'),
          onPress: () => updateCurrentUserEmail()
        }] : [])
      ]
    );
  };

  const updateCurrentUserEmail = async () => {
    try {
      const userUpdates = [{
        userId: user.id,
        newEmail: user.emailAddresses[0].emailAddress
      }];

      const response = await fetch(`${API_URL}/admin/update-user-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUserId,
          userUpdates
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(t('success'), t('emailUpdatedSuccess'));
        fetchUsers(); // Refresh the list
      } else {
        Alert.alert(t('error'), result.error || t('failedToUpdateEmail'));
      }
    } catch (error) {
      console.error('Error updating email:', error);
      Alert.alert(t('error'), t('networkErrorEmail'));
    }
  };

  const updateFakeEmails = async () => {
    // Find users with fake @clerk.user emails
    const usersWithFakeEmails = users.filter(u => u.email && u.email.includes('@clerk.user'));
    
    if (usersWithFakeEmails.length === 0) {
      Alert.alert('Info', t('couldNotUpdateEmails'));
      return;
    }

    Alert.alert(
      t('updateEmailAddresses'),
      `${t('found')} ${usersWithFakeEmails.length} ${t('usersWithTempEmails')}\n\n${t('onlyWorksForLoggedIn')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('update'), 
          onPress: async () => {
            try {
              // For now, we can only update the current admin user's email
              const currentUserUpdate = usersWithFakeEmails.find(u => u.id === user?.id);
              
              if (currentUserUpdate && user?.emailAddresses?.[0]?.emailAddress) {
                const userUpdates = [{
                  userId: user.id,
                  newEmail: user.emailAddresses[0].emailAddress
                }];

                const response = await fetch(`${API_URL}/admin/update-user-emails`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    adminUserId,
                    userUpdates
                  }),
                });

                const result = await response.json();

                if (response.ok) {
                  Alert.alert(t('success'), result.message || t('emailsUpdatedSuccess'));
                  fetchUsers(); // Refresh the list
                } else {
                  Alert.alert(t('error'), result.error || t('failedToUpdateEmails'));
                }
              } else {
                Alert.alert('Info', t('couldNotUpdateEmails'));
              }
            } catch (error) {
              console.error('Error updating fake emails:', error);
              Alert.alert(t('error'), t('networkErrorEmails'));
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }) => {
    const hasTemporaryEmail = item.email && item.email.includes('@clerk.user');
    const hasRealEmail = item.email && !hasTemporaryEmail;
    
    let displayText, textStyle, iconName, iconColor;
    
    if (hasRealEmail) {
      displayText = item.email;
      textStyle = styles.userEmail;
      iconName = "checkmark-circle-outline";
      iconColor = COLORS.income;
    } else if (hasTemporaryEmail) {
      displayText = t('tapToViewDetails');
      textStyle = [styles.userEmail, styles.temporaryEmailText];
      iconName = "information-circle-outline";
      iconColor = COLORS.secondary;
    } else {
      displayText = item.id;
      textStyle = [styles.userEmail, styles.noEmailText];
      iconName = "help-circle-outline";
      iconColor = COLORS.textLight;
    }
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Ionicons 
              name={item.role === 'admin' ? 'shield-checkmark' : 'person'} 
              size={16} 
              color={item.role === 'admin' ? COLORS.primary : COLORS.textLight} 
              style={styles.userIcon}
            />
            <TouchableOpacity 
              style={[
                styles.emailContainer,
                hasTemporaryEmail && styles.clickableEmailContainer
              ]}
              onPress={() => revealUserEmail(item)}
            >
              <Text style={textStyle}>
                {displayText}
              </Text>
              <Ionicons 
                name={iconName} 
                size={16} 
                color={iconColor} 
                style={styles.infoIcon}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.userRole}>{t('roleLabel')} {item.role}</Text>
          <Text style={styles.userDate}>
            {t('joined')} {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.inspection_count !== undefined && (
            <Text style={styles.userInspections}>
              📊 {item.inspection_count} {t('inspectionsCount')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.roleButton,
            { backgroundColor: item.role === 'admin' ? COLORS.expense : COLORS.primary }
          ]}
          onPress={() => handleRoleChange(item.id, item.role, item.email)}
        >
          <Text style={styles.roleButtonText}>
            {item.role === 'admin' ? t('removeAdmin') : t('makeAdmin')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('loadingUsers')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('userManagement')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.updateEmailsButton}
            onPress={updateFakeEmails}
          >
            <Ionicons name="mail" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setPromoteModalVisible(true)}
          >
            <Ionicons name="person-add" size={24} color={COLORS.white} />
            <Text style={styles.addButtonText}>{t('promoteUser')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>{t('noUsersFound')}</Text>
            <Text style={styles.emptySubtext}>{t('usersWillAppear')}</Text>
          </View>
        )}
      />

      {/* Promote User Modal */}
      <Modal
        visible={promoteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPromoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('promoteToAdminTitle')}</Text>
              <TouchableOpacity
                onPress={() => setPromoteModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalInstructions}>
              {t('enterEmailAddress')}
              {'\n\n'}💡 {t('userWillBeCreated')}
            </Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder={t('enterEmailPlaceholder')}
              placeholderTextColor={COLORS.textLight}
              value={emailToPromote}
              onChangeText={setEmailToPromote}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPromoteModalVisible(false);
                  setEmailToPromote('');
                }}
                disabled={promoting}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.promoteButton,
                  promoting && styles.promoteButtonDisabled
                ]}
                onPress={promoteUserByEmail}
                disabled={promoting}
              >
                {promoting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.promoteButtonText}>{t('promote')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.textLight,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  updateEmailsButton: {
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '500',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userIcon: {
    marginRight: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  clickableEmailContainer: {
    borderColor: COLORS.secondary,
    borderStyle: 'dashed',
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  temporaryEmailText: {
    color: COLORS.secondary,
    fontStyle: 'italic',
    fontSize: 14,
  },
  noEmailText: {
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  infoIcon: {
    marginLeft: 6,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
    marginLeft: 24,
  },
  userDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
    marginLeft: 24,
  },
  userInspections: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
    marginLeft: 24,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  roleButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalInstructions: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  promoteButton: {
    backgroundColor: COLORS.primary,
  },
  promoteButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  cancelButtonText: {
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  promoteButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '500',
  },
};

export default UserManagement;