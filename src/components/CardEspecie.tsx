import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { TextNunitoSans } from "./TextNunitoSans";
import { themeColors } from "../theme/theme";


export function CardEspecie({ especie: { item: especie } })  {
    //const especie = especieRecibida.item;
    const uriImagen = especie?.imagen ?? undefined;

    return (
        <View key={ especie?.sp_id } style={styles.container}>
            <View style={styles.item}>
                <Image
                    source={{ uri: uriImagen }}
                    style={styles.imagen}
                    placeholder={require("@/assets/images/placeholder.png")}
                />
                <TextNunitoSans style={{marginLeft: 10}} numberOfLines={1}>{especie?.nombre_cientifico}</TextNunitoSans>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 17,
        backgroundColor: themeColors.cardBackground,
        margin: 10,
        width: 140,
        alignItems: "center",
    },
    item: {
        margin: 10
    },
    imagen: {
        width: 120,
        height: 120,
        borderRadius: 15
    }
});