import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const FaceRecognition = () => {
  const [name, setName] = useState('');
  const [registeredImage, setRegisteredImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const devices = useCameraDevices();
  const device = devices.back || devices.front || null || devices[1];
  const cameraRef = useRef(null);

  useEffect(() => {
    console.log('Camera ref updated:', cameraRef.current);
  }, [cameraRef]);
  
  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      console.log("camera: ",cameraPermission);
      if (cameraPermission === 'granted') {
        const newPermission = await Camera.requestCameraPermission();
        console.log("request came: ",newPermission);
        if (newPermission !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required.');
        }
      }
    };
    requestPermissions();
  }, []);

  const captureImage = async () => {
    try {
      console.log("camera ref: ",cameraRef.current);
      if (!cameraRef.current) {
        throw new Error('Camera is not available.');
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
      });

      const imageBase64 = photo.base64;
      if (imageBase64) {
        return imageBase64;
      } else {
        throw new Error('Failed to capture image.');
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      throw new Error('Failed to capture image.');
    }
  };

  const registerFace = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }

    if (!device) {
      Alert.alert('Error', 'No camera device available.');
      return;
    }

    setCameraActive(true);
    try {
      const imageBase64 = await captureImage();
      setRegisteredImage(imageBase64);
      Alert.alert('Success', `Face registered for ${name}.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCameraActive(false);
    }
  };

  if (cameraActive && !device) {
    return (
      <View style={styles.container}>
        <Text>Initializing Camera...</Text>
      </View>
    );
  }

  if (cameraActive && device) {
    return (
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Recognition App</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />
      <Button title="Register Face" onPress={registerFace} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
  },
});

export default FaceRecognition;
