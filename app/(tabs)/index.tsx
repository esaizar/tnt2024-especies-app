import { EspecieList } from "@/src/components/EspecieList";
import { HomeFilter } from "@/src/components/HomeFilter";
import { TextNunitoSans } from "@/src/components/TextNunitoSans";
import { useFilteredEspecies } from "@/src/services/especies.hooks";
import { TReino, TReinoEnum } from "@/src/services/especies.service";
import { themeColors, themeStyles } from "@/src/theme/theme";
import { useAuth } from "@/src/context/auth.context";
import { useState } from "react";
import {
  Button,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [filter, setFilter] = useState<TReino | null>(null);
  const { user, signOut } = useAuth();

  const displayName = user
    ? (user.user_metadata?.full_name as string) || user.email || "Usuario"
    : "Anónimo";

  const {
    data: especies, // renombro data a especies
    isFetching,
    isError,
    refetch,
  } = useFilteredEspecies(filter);

  //
  // Event handlers
  //
  const handleRemoveFilter = () => {
    setFilter(null);
  };

  // función que recibe un parámetro y retorna otra la definición de otra función
  const handleFilter = (reino: TReino) => () => {
    setFilter(reino);
  };

  const handleReintentar = () => {
    // solo ejecuta refetch si refetch no es falsy
    refetch?.();
  };

  //
  // Render
  //
  return (
    <SafeAreaView style={[themeStyles.screen, styles.container]}>
      <View style={styles.titleContainer}>
        <View style={styles.greetingRow}>
          <TextNunitoSans style={styles.title}>Hola {displayName}</TextNunitoSans>
          {user && (
            <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color={themeColors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filtersContainer}>
          <Pressable onPress={handleRemoveFilter}>
            <HomeFilter filter={filter} name={null} />
          </Pressable>
          <Pressable onPress={handleFilter(TReinoEnum.ANIMALIA)}>
            <HomeFilter filter={filter} name={TReinoEnum.ANIMALIA} />
          </Pressable>
          <Pressable onPress={handleFilter(TReinoEnum.FUNGI)}>
            <HomeFilter filter={filter} name={TReinoEnum.FUNGI} />
          </Pressable>
          <Pressable onPress={handleFilter(TReinoEnum.PLANTAE)}>
            <HomeFilter filter={filter} name={TReinoEnum.PLANTAE} />
          </Pressable>
        </View>
      </View>

      {isFetching && <TextNunitoSans>Cargando...</TextNunitoSans>}
      {!isFetching && isError && (
        <View>
          <TextNunitoSans style={styles.textError}>
            Error al cargar las especies
          </TextNunitoSans>
          <Button title="Reintentar" onPress={handleReintentar} />
        </View>
      )}
      <EspecieList especies={especies} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    gap: 10,
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: themeColors.textBase,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoutBtn: {
    padding: 4,
  },
  titleContainer: { gap: 35 },
  textError: {
    color: "red",
  },
});
