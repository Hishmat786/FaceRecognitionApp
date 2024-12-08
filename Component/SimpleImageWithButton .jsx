import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    Button,
    Image,
    StyleSheet,
    Platform,
    Alert,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { FaceCore, MatchFacesResponse } from '@regulaforensics/react-native-face-core-match';

const CameraComponent = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [referenceImageBase64, setReferenceImageBase64] = useState(null);

    const camera = useRef(null);
    const devices = useCameraDevices();
    const device = devices[1]; // Use the front camera

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

    const openCamera = () => setIsCameraOpen(true);
    const closeCamera = () => setIsCameraOpen(false);

    const takePhoto = async () => {
        if (camera.current) {
            try {
                const photo = await camera.current.takePhoto({ flash: 'off' });
                const imageUri = `file://${photo.path}`;
                setCapturedImage(imageUri);

                // Convert captured image to base64
                const imageBase64 = await RNFS.readFile(photo.path, 'base64');
                performFaceRecognition(imageBase64); // Perform face recognition after capturing the photo

                setIsCameraOpen(false);
            } catch (error) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo.');
            }
        }
    };

    const copyFileToDocumentDirectory = async () => {
        try {
            const targetPath = `${RNFS.DocumentDirectoryPath}/hishmat.jpeg`;
            const assetPath = '../assests/images/hishmat.jpeg'; // Relative path inside the assets folder
            console.log("Asset Path:", assetPath, "Target Path:", targetPath);
            // Check if the file already exists
            console.log(RNFS.DocumentDirectoryPath);
            const fileExists = await RNFS.exists(targetPath);
            console.log("File already exists:", fileExists);
    
            if (!fileExists) {
                console.log("Copying file from assets to document directory...");
                await RNFS.copyFileAssets(assetPath, targetPath); // This copies the file from assets
            } else {
                console.log("File already copied to document directory.");
            }
    
            console.log("Target Path:", targetPath);
            return targetPath;
        } catch (error) {
            console.error("Error copying file:", error);
            throw error;
        }
    };
    
    const performFaceRecognition = async (capturedImageBase64) => {
        try {
            if (!referenceImageBase64) {
                console.log("Reference loading base64");
    
                const referenceImagePath = await copyFileToDocumentDirectory();
                console.log("Reference Image Path:", referenceImagePath);
    
                const fileExists = await RNFS.exists(referenceImagePath);
                console.log("File Exists After Copy:", fileExists);
    
                if (!fileExists) {
                    throw new Error("Reference image file does not exist after copying.");
                }
    
                const base64 = await RNFS.readFile(referenceImagePath, 'base64');
                setReferenceImageBase64(base64);
                console.log('Reference Image Base64 Loaded:', base64);
            }
    
            const matchResponse = await FaceCore.matchFaces({
                image1: { imageBase64: referenceImageBase64 },
                image2: { imageBase64: capturedImageBase64 },
            });
    
            if (matchResponse.result && matchResponse.result[0].similarity > 0.8) {
                Alert.alert('Match Found', 'The captured face matches the reference image.');
            } else {
                Alert.alert('No Match', 'The captured face does not match the reference image.');
            }
        } catch (error) {
            console.error("Error in face recognition:", error);
            Alert.alert('Error', 'Failed to perform face recognition.');
        }
    };
    

    useEffect(() => {
        requestPermissions();
    }, []);

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
            <Image source={require('../assests/images/hishmat.jpeg')} style={styles.capturedImage} />
            <Button title="Open Camera" onPress={openCamera} />
            {capturedImage && (
                <View style={styles.imagePreview}>
                    <Text style={styles.previewText}>Captured Image:</Text>
                    <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
                </View>
            )}
        </View>
    );
};

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
    imagePreview: { marginTop: 20, alignItems: 'center' },
    previewText: { fontSize: 16, marginBottom: 10 },
    text: { fontSize: 18, color: 'red', textAlign: 'center', margin: 20 },
});

export default CameraComponent;
