import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Image, StyleSheet, Platform } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import * as faceAPI from 'face-api.js';
import { PermissionsAndroid } from 'react-native';

function FaceRecognition() {
  const [hasPermission, setHasPermission] = useState(null); // Default to null
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices[1] || devices.back;

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const cameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      setHasPermission(cameraPermission === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    }
  };

  useEffect(() => {
    requestPermissions();
    // Load face-api models once the component mounts
    const loadModels = async () => {
      await faceAPI.nets.tinyFaceDetector.loadFromUri('assets/models');
      await faceAPI.nets.faceLandmark68Net.loadFromUri('assets/models');
      await faceAPI.nets.faceRecognitionNet.loadFromUri('assets/models');
    };
    loadModels();
  }, []);

  const openCamera = () => setIsCameraOpen(true);
  const closeCamera = () => setIsCameraOpen(false);

  const takePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({ flash: 'off' });
        const imageUri = `file://${photo.path}`;
        setCapturedImage(imageUri);
        setIsCameraOpen(false);
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };

  if (hasPermission === null) {
    return <Text style={styles.text}>Checking permissions...</Text>;
  }

  if (!hasPermission) {
    return <Text style={styles.text}>Camera permission not granted</Text>;
  }

  if (isCameraOpen && device) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isCameraOpen}
          photo={true}
          ref={camera}
        />
        <View style={styles.cameraControls}>
          <Button title="Snap" onPress={takePhoto} />
          <Button title="Close" onPress={closeCamera} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.previewText}>Reference Image:</Text>
      <Image
        source={require('../assests/images/hishmat.jpeg')}// Static reference image path
        style={styles.referenceImage}
      />
      <Button title="Open Camera" onPress={openCamera} />
      {capturedImage && (
        <View style={styles.imagePreview}>
          <Text style={styles.previewText}>Captured Image:</Text>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        </View>
      )}
      {isDetecting && <Text>Detecting face...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraContainer: { flex: 1, justifyContent: 'flex-end' },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  capturedImage: { width: 200, height: 200, borderRadius: 10 },
  referenceImage: { width: 200, height: 200, borderRadius: 10, borderWidth: 2, borderColor: 'blue' },
  imagePreview: { marginTop: 20, alignItems: 'center' },
  previewText: { fontSize: 16, marginBottom: 10 },
  text: { fontSize: 18, color: 'red', textAlign: 'center', margin: 20 },
});

export default FaceRecognition;
