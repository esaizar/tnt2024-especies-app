import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { supabase } from "@/src/utils/supabase";
import { CustomTextInput } from "./CustomTextInput";
import { CustomButton } from "./CustomButton";
import { TextNunitoSans } from "./TextNunitoSans";
import { themeColors } from "../theme/theme";

export const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Error al iniciar sesión", error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert("Error al registrarse", error.message);
    } else {
      Alert.alert(
        "Registro exitoso",
        "Revisá tu email para confirmar tu cuenta (si aplica)."
      );
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TextNunitoSans style={styles.title}>
        {mode === "login" ? "Iniciar sesión" : "Registrarse"}
      </TextNunitoSans>
      <TextNunitoSans style={styles.subtitle}>
        Para enviar un reporte necesitás una cuenta.
      </TextNunitoSans>

      <CustomTextInput
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <CustomTextInput
        placeholder="Contraseña"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        autoCapitalize="none"
      />

      <Pressable
        onPress={mode === "login" ? handleLogin : handleRegister}
        disabled={loading}
      >
        <CustomButton
          label={
            loading
              ? "Cargando..."
              : mode === "login"
              ? "Iniciar sesión"
              : "Registrarse"
          }
        />
      </Pressable>

      <Pressable
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      >
        <TextNunitoSans style={styles.switchText}>
          {mode === "login"
            ? "¿No tenés cuenta? Registrate"
            : "¿Ya tenés cuenta? Iniciá sesión"}
        </TextNunitoSans>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 30,
    gap: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#aaa",
    marginBottom: 8,
  },
  switchText: {
    textAlign: "center",
    color: themeColors.primary,
    fontSize: 14,
  },
});
