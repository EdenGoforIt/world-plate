import { ActivityIndicator, SafeAreaView, Text, StyleSheet } from "react-native";

const Loader = () => (
  <SafeAreaView style={styles.loaderContainer}>
    <ActivityIndicator size="large" color="#E74C3C" />
    <Text style={styles.loaderText}>Loading...</Text>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEFEFE",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2C3E50",
  },
});

export default Loader;
