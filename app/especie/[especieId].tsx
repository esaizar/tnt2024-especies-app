import { EspecieDetail } from "@/src/components/EspecieDetail";
import { TextNunitoSans } from "@/src/components/TextNunitoSans";
import { useEspecie } from "@/src/services/especies.hooks";
import { themeStyles } from "@/src/theme/theme";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { EspecieHeader } from "@/src/components/EspecieHeader";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EspecieShowScreen() {
  const searchParams = useLocalSearchParams();

  const spId =
    typeof searchParams.especieId === "string"
      ? parseInt(searchParams.especieId)
      : 1;

  const { data: especie, isFetching, isError } = useEspecie(spId);

  if (isFetching) {
    return (
      <View style={styles.container}>
        <TextNunitoSans>Cargando...</TextNunitoSans>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <TextNunitoSans>ERROR!</TextNunitoSans>
      </View>
    );
  }

  if (!especie) {
    return (
      <View style={styles.container}>
        <TextNunitoSans>La especie no existe</TextNunitoSans>
      </View>
    );
  }

  return (

// TODO chequear q funcione bien el margen superior

    <SafeAreaView style={themeStyles.screen}>
    {/* <View style={themeStyles.screen}> */}
      <EspecieHeader especie={especie} />
      <EspecieDetail especie={especie} />
    {/* </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
