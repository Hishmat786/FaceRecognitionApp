import React, { useEffect } from 'react';
import { Alert } from 'react-native';
// import FaceSDK  from '@regulaforensics/react-native-face-api';

import {StyleSheet, SafeAreaView} from 'react-native';
// import FaceRecog from './Component/FaceRecog';
// import FaceRecognition from './Component/FaceRecognition';
// import SimpleImageWithButton from './Component/SimpleImageWithButton ';
// import SimpleImageWithCamera from './Component/SimpleImageWithButton ';
import User from './Component/User';
function App(): React.JSX.Element {
  return (
    // <FaceRecog/>
    <SafeAreaView style={{flex: 1}}>
      {/* <FaceRecognition/> */}
      {/* <SimpleImageWithCamera/> */}
      <User/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

export default App;
