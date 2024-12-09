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
import FaceSDK, { MatchFacesImage, MatchFacesRequest, MatchFacesResponse, ImageType } from '@regulaforensics/react-native-face-api';
import * as Regula from '@regulaforensics/react-native-face-core-match';
// import { FaceSDK } from '@regulaforensics/react-native-face-api';

const EmployeeDataComponent = () => {
    const [employeeData, setEmployeeData] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [referenceImageBase64, setReferenceImageBase64] = useState(null);

    const camera = useRef(null);
    const devices = useCameraDevices();
    const device = devices[1]; // Use the front camera


    useEffect(() => {
        // console.log('Facesdk', FaceSDK)
        const fetchEmployeeData = async () => {
            const userId = 'SUK220030'; // Hardcoded user ID
            const adminName = 'ayaz'; // Hardcoded admin name

            const query = new URLSearchParams({
                userId,
                adminName,
            }).toString();

            try {
                const response = await fetch(`http://10.102.138.75:3000/api/get-employee/?${query}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch employee data');
                }
                const data = await response.json();
                setEmployeeData(data);

                // Download and load reference image as Base64
                if (data.imageUrl) {
                    const remoteImageUrl = `http://10.102.138.75:3000${data.imageUrl}`;
                    const localFilePath = `${RNFS.DocumentDirectoryPath}/referenceImage.jpg`;

                    const downloadResult = await RNFS.downloadFile({
                        fromUrl: remoteImageUrl,
                        toFile: localFilePath,
                    }).promise;

                    if (downloadResult.statusCode === 200) {

                        const base64 = await RNFS.readFile(localFilePath, 'base64');
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
                console.log("going to face recog")
                performFaceRecognition(capturedBase64);

                setIsCameraOpen(false);
                Alert.alert('Success', 'Photo captured successfully.');
            } catch (error) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo.');
            }
        }
    };

    // const performFaceRecognition = async (capturedBase64) => {
    //     console.log("inside recognitioon")
    //     if (!referenceImageBase64) {
    //         Alert.alert('Error', 'No reference image available for recognition.');
    //         return;
    //     }
    //     console.log("image matching")

    //     const firstImage = new MatchFacesImage();
    //     console.log("firstImage",firstImage)
    //     firstImage.imageType = ImageType.IMAGE_TYPE_PRINTED;
    //     firstImage.bitmap = referenceImageBase64;
    //     // console.log("firstImage",firstImage)
    //     const secondImage = new MatchFacesImage();
    //     secondImage.imageType = ImageType.IMAGE_TYPE_PRINTED;
    //     secondImage.bitmap = capturedBase64;
    //     console.log("secondImage",secondImage)
    //     const request = new MatchFacesRequest();
    //     console.log("request",request)
    //     request.images = [firstImage, secondImage];

    //     FaceSDK.matchFaces(JSON.stringify(request), matchFacesResponse => {
    //         const response = MatchFacesResponse.fromJson(JSON.parse(matchFacesResponse));
    //         // ... check response.results for results with score and similarity values.
    //     }, e => { console.log("error",e)});

    //     console.log("processing recognition")
    //     // try {
    //     //     const images = [
    //     //         { image: referenceImageBase64, type: 1 }, // Type 1 for Printed (check documentation for exact value)
    //     //         { image: capturedBase64, type: 0 }, // Type 0 for Live
    //     //     ];

    //     //     const matchResponse = await FaceSDK.matchFaces({ images });

    //     //     console.log("matchResponse: ", matchResponse);
    //     //     const processedResponse = await FaceSDK.splitComparedFaces(matchResponse.results, 0.8); // Use a threshold

    //     //     if (processedResponse.matchedFaces.length > 0) {
    //     //         Alert.alert('Match Found', 'The captured face matches the reference image.');
    //     //     } else {
    //     //         Alert.alert('No Match', 'The captured face does not match the reference image.');
    //     //     }
    //     // } catch (error) {
    //     //     console.error('Error in face recognition:', error);
    //     //     Alert.alert('Error', 'Failed to perform face recognition.');
    //     // }
    // };


    const performFaceRecognition = async (capturedBase64) => {
        try {
            console.log('Starting face recognition process');

            // Check if reference image exists
            if (!referenceImageBase64) {
                Alert.alert('Error', 'No reference image available for recognition.');
                return;
            }

            // Create the first MatchFacesImage object for the reference image
            const firstImage = new MatchFacesImage();
            firstImage.imageType = ImageType.IMAGE_TYPE_PRINTED; // Type of the reference image
            firstImage.bitmap = referenceImageBase64;

            // Create the second MatchFacesImage object for the captured image
            const secondImage = new MatchFacesImage();
            secondImage.imageType = ImageType.IMAGE_TYPE_LIVE; // Type of the captured image
            secondImage.bitmap = capturedBase64;

            console.log('First and second MatchFacesImage objects created');

            // Create the MatchFacesRequest object with the images
            const request = new MatchFacesRequest();
            request.images = [firstImage, secondImage];

            // console.log('MatchFacesRequest created:', JSON.stringify(request));

            console.log("Perform face r")
            FaceSDK.matchFaces(
                JSON.stringify(request), // First argument: Serialized request
                (matchFacesResponse) => { // Second argument: Success callback
                    console.log('MatchFacesResponse:', matchFacesResponse);

                    // Parse the response
                    const response = MatchFacesResponse.fromJson(JSON.parse(matchFacesResponse));

                    // Check the response results for similarity scores
                    if (response.results && response.results.length > 0) {
                        const [result] = response.results;
                        const similarityPercentage = (result.similarity * 100).toFixed(2);
                        if (result.similarity > 0.8) {
                            Alert.alert('Match Found', `Similarity: ${similarityPercentage}%`);
                        } else {
                            Alert.alert('No Match', `Similarity: ${similarityPercentage}%`);
                        }
                    } else {
                        Alert.alert('Error', 'No matching results found.');
                    }
                },
                (error) => { // Third argument: Error callback
                    console.error('Error in matchFaces:', error);
                    Alert.alert('Error', 'Failed to perform face matching.');
                },
                null // Fourth argument: Additional options (nullable or optional)
            );

            console.log('Face recognition process completed');
        } catch (error) {
            console.error('Error in performFaceRecognition:', error);
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
