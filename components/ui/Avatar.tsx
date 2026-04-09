import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { useTheme } from '../../themes/useTheme';

export interface AvatarProps {
    name: string;
    size?: 'xs' | 'small' | 'medium' | 'large';
    imageUrl?: string;
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
    name,
    size = 'medium',
    imageUrl,
    style,
}) => {
    const theme = useTheme();
    let avatarSize;
    let fontSize;

    switch (size) {
        case 'xs':
            avatarSize = theme.spacing.avatarSizeXs;
            fontSize = 10;
            break;
        case 'small':
            avatarSize = theme.spacing.avatarSizeSmall;
            fontSize = 14;
            break;
        case 'large':
            avatarSize = theme.spacing.avatarSizeLarge;
            fontSize = 40;
            break;
        default:
            avatarSize = theme.spacing.avatarSize;
            fontSize = 24;
    }

    return (
        <View
            style={[
                styles.container,
                {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: theme.colors.primary,
                },
                style,
            ]}
        >
            {imageUrl ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={[
                        styles.image,
                        {
                            width: avatarSize,
                            height: avatarSize,
                            borderRadius: avatarSize / 2,
                        },
                    ]}
                />
            ) : (
                <Text
                    style={[
                        styles.text,
                        {
                            fontSize,
                            color: theme.colors.textInverse,
                            fontWeight: '700',
                        },
                    ]}
                >
                    {name[0]?.toUpperCase() || '?'}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    image: {
        resizeMode: 'cover',
    },
    text: {
        textAlign: 'center',
    },
});
