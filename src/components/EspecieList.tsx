import { FlatList, StatusBar, StyleSheet } from "react-native"
import { EspecieHome } from "../adapters/homeAdapters";
import { CardEspecie } from "./CardEspecie";
import { FC } from "react";
import { Link } from "expo-router";

type EspecieListProps = {
    especies: EspecieHome[];
};
export  const EspecieList: FC<EspecieListProps> = ({ especies }) => {
    
    return (
        
        <FlatList 
            data={especies}
            keyExtractor={item => item.nombre_cientifico}
            numColumns={2}
            columnWrapperStyle={{
                justifyContent: "space-between"
            }}
            style={styles.container}
            renderItem={ especie => (
                // <Link href={`/especie/${especie.item.sp_id}`} style={{marginVertical: 5}}> link href params
                <Link href={{pathname: "/especie/[especieId]", params: { especieId: especie.item.sp_id }}}  style={{marginVertical: 5}}>
                    <CardEspecie especie={ especie } />
                </Link>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      //marginTop: StatusBar.currentHeight || 0,
      marginBottom: 10
    },
});
