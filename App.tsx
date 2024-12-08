import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  StyleSheet, SafeAreaView
} from 'react-native';
import FaceRecog from './Component/FaceRecog';
import FaceRecognition from './Component/FaceRecognition';
import SimpleImageWithButton from './Component/SimpleImageWithButton ';
import SimpleImageWithCamera from './Component/SimpleImageWithButton ';


function App(): React.JSX.Element {
 
  return (
    // <FaceRecog/>
    <SafeAreaView style={{ flex: 1 }}>
      {/* <FaceRecognition/> */}
    <SimpleImageWithCamera/>
  </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  
});

export default App;
