import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    Alert,
    Image,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { FaceCore } from '@regulaforensics/react-native-face-core-match';

const EmployeeDataComponent = () => {
    const [employeeData, setEmployeeData] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [referenceImageBase64, setReferenceImageBase64] = useState(null);

    const camera = useRef(null);
    const devices = useCameraDevices();
    const device = devices[1]; // Use the front camera

    useEffect(() => {
        const fetchEmployeeData = async () => {
            const userId = 'SUK220030'; // Hardcoded user ID
            const adminName = 'ayaz'; // Hardcoded admin name

            const query = new URLSearchParams({
                userId,
                adminName,
            }).toString();

            try {
                const response = await fetch(`http://10.102.138.178:3000/api/get-employee/?${query}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch employee data');
                }
                const data = await response.json();
                setEmployeeData(data);

                // Download and load reference image as Base64
                if (data.imageUrl) {
                    const remoteImageUrl = `http://10.102.138.178:3000${data.imageUrl}`;
                    const localFilePath = `${RNFS.DocumentDirectoryPath}/referenceImage.jpg`;

                    // Download the image
                    const downloadResult = await RNFS.downloadFile({
                        fromUrl: remoteImageUrl,
                        toFile: localFilePath,
                    }).promise;

                    if (downloadResult.statusCode === 200) {
                        const base64 = await RNFS.readFile(localFilePath, 'base64');
                        // console.log('Reference Image Base64:', base64);
                        setReferenceImageBase64(base64);
                    } else {
                        throw new Error('Failed to download reference image');
                    }
                }
            } catch (error) {
                console.error('Error fetching employee data:', error);
                Alert.alert('Error', 'Failed to fetch employee data.');
            }
        };

        fetchEmployeeData();
    }, []);

    const openCamera = () => setIsCameraOpen(true);
    const closeCamera = () => setIsCameraOpen(false);

    const takePhoto = async () => {
        if (camera.current) {
            try {
                const photo = await camera.current.takePhoto({ flash: 'off' });
                const imageUri = `file://${photo.path}`;
                setCapturedImage(imageUri);

                // Convert captured image to Base64
                const capturedBase64 = await RNFS.readFile(photo.path, 'base64');
                performFaceRecognition(capturedBase64);

                setIsCameraOpen(false);
                Alert.alert('Success', 'Photo captured successfully.');
            } catch (error) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo.');
            }
        }
    };

    const performFaceRecognition = async (capturedBase64) => {
        try {
            if (!referenceImageBase64) {
                Alert.alert('Error', 'No reference image available for recognition.');
                return;
            }
            console.log("Loading images")
            const matchResponse = await FaceCore.matchFaces({
                image1: { imageBase64: referenceImageBase64 },
                image2: { imageBase64: capturedBase64 },
            });

            console.log("Match Response:", matchResponse);
            if (matchResponse.result && matchResponse.result[0].similarity > 0.8) {
                Alert.alert('Match Found', 'The captured face matches the reference image.');
            } else {
                Alert.alert('No Match', 'The captured face does not match the reference image.');
            }
        } catch (error) {
            console.error('Error in face recognition:', error);
            Alert.alert('Error', 'Failed to perform face recognition.');
        }
    };

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
            <Text style={styles.title}>Employee Image</Text>
            {employeeData && employeeData.imageUrl ? (
                <Image
                    source={{ uri: `http://10.102.138.178:3000${employeeData.imageUrl}` }}
                    style={styles.image}
                />
            ) : (
                <Text style={styles.loadingText}>Loading employee image...</Text>
            )}
            <Button title="Take Picture" onPress={openCamera} />
            {capturedImage && (
                <View style={styles.imagePreview}>
                    <Text style={styles.previewText}>Captured Image:</Text>
                    <Image source={{ uri: capturedImage }} style={styles.image} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
    },
    loadingText: {
        fontSize: 16,
        color: 'gray',
    },
    imagePreview: {
        marginTop: 20,
        alignItems: 'center',
    },
    previewText: {
        fontSize: 16,
        marginBottom: 10,
    },
});

export default EmployeeDataComponent;
