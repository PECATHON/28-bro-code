import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student'); // or 'vendor'
  const [password, setPassword] = useState('');

  async function onRegister() {
    // call API to register. After success, navigate to Login
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={onRegister}>
        <Text style={styles.btnText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({ container:{flex:1,justifyContent:'center',padding:20}, title:{fontSize:20,marginBottom:12}, input:{borderWidth:1,padding:12,borderRadius:8,marginBottom:12}, btn:{backgroundColor:'#333',padding:12,borderRadius:8,alignItems:'center'}, btnText:{color:'#fff'} });