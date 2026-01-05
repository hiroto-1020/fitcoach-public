import { View, Button, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export default function PickerTest() {
  const [uri, setUri] = useState<string | null>(null);
  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!res.canceled) setUri(res.assets[0].uri);
  }
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Button title="写真を選ぶ" onPress={pick} />
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: 240, borderRadius: 8 }} /> : null}
    </View>
  );
}
