import { Pressable, View } from "react-native";
import { TextNunitoSans } from "./TextNunitoSans";
import { themeColors } from "../theme/theme";
import { Link } from "expo-router";
import { FC } from "react";
import { TEspecie } from "../services/especies.service";


type EspecieDetailProps = {
    especie: TEspecie
}
export const EspecieDetail: FC<EspecieDetailProps> = ({ especie }) => {

    const datosAMostrar = [
        { label: "ID",      clave: "sp_id" },
        { label: "Reino",   clave: "reino" },
        { label: "Phy/Div", clave: "phydiv" },
        { label: "Clase",   clave: "clase" },
        { label: "Orden",   clave: "orden" },
        { label: "Familia", clave: "familia" },
        { label: "Origen",  clave: "origen" },
    ];

    return (
        <View style={{flex: 1}}>
            {datosAMostrar.map((item) => (
                <View key={item.label+item.clave} style={{flexDirection: "row", marginTop: 15}}>
                    <TextNunitoSans style={{color: themeColors.primary, width: 70, textAlign: "right", marginRight: 20}}>{item.label}</TextNunitoSans> 
                    <TextNunitoSans style={{textTransform: "capitalize"}}>{especie[item.clave] ?? "-"}</TextNunitoSans> 
                </View>
            ))}
            
            <Link href={`/(tabs)/report`} asChild>
                <Pressable style={{justifyContent: "center", alignItems: "center", marginTop: 20}}>
                    <TextNunitoSans style={{backgroundColor: themeColors.primary, borderRadius: 30, padding: 10}}>Reportar Avistaje</TextNunitoSans>
                </Pressable>
            </Link>
        </View>
    );
}