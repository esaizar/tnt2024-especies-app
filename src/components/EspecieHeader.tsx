import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { ImageBackground, Pressable, StyleSheet, View } from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { TextNunitoSans } from "@/src/components/TextNunitoSans";
import { themeColors } from "@/src/theme/theme";
import { TEspecie } from "@/src/services/especies.service";
import { supabase } from "@/src/utils/supabase";


type EspecieHeaderProps = {
    especie: TEspecie
}
export function EspecieHeader({ especie }: EspecieHeaderProps) {

    const uriImagen = especie?.imagen ? { uri: especie?.imagen } : require("@/assets/images/placeholder.png");

    // TODO hacer que funcnionen las constantes
    //const supabase = createClient(`${process.env.SUPABASE_URL}`, `${process.env.SUPABASE_KEY}`)
    // const supabase = createClient("https://ytoozusutyyxivixtmgl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0b296dXN1dHl5eGl2aXh0bWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAwMjYxNDYsImV4cCI6MjAzNTYwMjE0Nn0.zL4f2PUk_bJblL6n98Ot3S4u0ZDgVxuy6n5XlvBjaaw")
    //const supabase = supabaseClient;

    const [likes, setLikes] = useState(0);

    useEffect(() => {
        const fetchLikes = async () => {
            const { data, error } = await supabase
                .from('especieslikes')
                .select('like')
                .eq('sp_id', especie.sp_id)
            if (data) {
                setLikes(data[0].like)
            }
        }
        fetchLikes()
    }, [])

    // Create a function to handle inserts... *
    const handleInserts = (payload) => {
        console.log('Change received!', payload)
        setLikes(payload.new.like)
    }
  
    // Listen to inserts
    supabase
        .channel('especieslikes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'especieslikes' }, handleInserts)
        .subscribe();
    
    const handlePress = async () => {

        if(likes === 0) {
            const { error } = await supabase
                .from('especieslikes')
                .insert({ sp_id: especie.sp_id, like: 1 })
            // Si el error es "code": "23505" (parece q es el codigo de duplicado)
            // se podría hacer un update
console.log('error: ', error)
        } else {
            const { error } = await supabase
                .from('especieslikes')
                .update({ like: likes + 1 })
                .eq('sp_id', especie.sp_id)
        }
    }

    return (
        <View style={{marginTop: -25}}>
            <View style={styles.botonesSuperiores} >
                <Link href={`/`} style={styles.botonVolver}> 
                    <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
                </Link>
                <Pressable style={styles.likes} onPress={handlePress}>
                    <FontAwesome name="heart" size={15} color={themeColors.heart} />
                    <TextNunitoSans style={{color: "black"}}>{likes?.toLocaleString()} likes</TextNunitoSans>
                </Pressable>
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