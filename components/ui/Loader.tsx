import { ActivityIndicator, SafeAreaView, Text } from "react-native";

const Loader = () => (
  <SafeAreaView className="flex-1 items-center justify-center bg-[#FEFEFE]">
    <ActivityIndicator size="large" color="#E74C3C" />
    <Text className="mt-2.5 text-base text-[#2C3E50]">Loading...</Text>
  </SafeAreaView>
);


export default Loader;
