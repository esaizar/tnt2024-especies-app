import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { ImageBackground, StyleSheet, View } from "react-native";
import { TextNunitoSans } from "./TextNunitoSans";
import { LinearGradient } from "expo-linear-gradient";
import { themeColors } from "../theme/theme";
import { TEspecie } from "../services/especies.service";

type EspecieHeaderProps = {
    especie: TEspecie
}
export function EspecieHeader({ especie }: EspecieHeaderProps) {

    const uriImagen = especie?.imagen ? { uri: especie?.imagen } : require("@/assets/images/placeholder.png");

    return (
        <View style={{marginTop: -25}}>
            <View style={styles.botonesSuperiores} >
                <Link href={`/`} style={styles.botonVolver}> 
                    <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
                </Link>
                <View style={styles.likes}>
                    <FontAwesome name="heart" size={15} color={themeColors.heart} />
                    <TextNunitoSans style={{color: "black"}}>{especie.likes} likes</TextNunitoSans>
                </View>
            </View>

            <ImageBackground source={uriImagen} style={styles.imagenYGradiente}>
                <LinearGradient 
                    colors={['rgba(48, 49, 45, 1)', 'rgba(48, 49, 45, 0.9)', 'rgba(30, 31, 24, 0)']}
                    start={{ x: 0.5, y: 1 }}
                    end={{ x: 0.5, y: 0 }}
                    locations={[0, 0.30, 0.55]}
                    style={styles.imagenYGradiente}
                />
                <TextNunitoSans numberOfLines={1} style={styles.nombreEspecie}>{especie.nombre_cientifico}</TextNunitoSans>
            </ImageBackground>

            <View style={styles.lineaDivision} />

        </View>
    );
}

const styles = StyleSheet.create({
    botonesSuperiores: {
        flexDirection: "row",
        justifyContent: 'space-between',
        top: 40,
        zIndex: 1
    },
    botonVolver: {
        backgroundColor: "white",
        borderRadius: 20,
        marginLeft: 15
    },
    likes: {
        flexDirection: "row",
        justifyContent: 'space-between',
        gap: 10,
        alignItems: "center",
        paddingHorizontal: 10,
        marginRight: 15,
        backgroundColor: "white",
        borderRadius: 20
    },
    imagenYGradiente: {
        height: 300
    },
    nombreEspecie: {
        marginLeft: 20,
        bottom: 65,
        fontSize: 24,
        fontWeight: 600
    },
    lineaDivision: {
        height: 25,
        borderTopEndRadius: 21,
        borderTopStartRadius: 21,
        backgroundColor: themeColors.screenBackground,
        zIndex: 1,
        top: -25}
})