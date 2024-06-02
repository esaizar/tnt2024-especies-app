import { TextNunitoSans } from "./TextNunitoSans";
import { View } from "react-native";
import { themeColors } from "../theme/theme";
import { TReino } from "../services/especies.service";

type filterProps = {
    filter: TReino | null,
    name: TReino | null
}

export function HomeFilter({ filter, name }: filterProps) {
    
    return (
        <View style={{borderBottomWidth: 1, borderColor: filter === name ? themeColors.primary : themeColors.screenBackground }}>
            <TextNunitoSans >{name?? 'TODOS'}</TextNunitoSans>
        </View>
    );
}