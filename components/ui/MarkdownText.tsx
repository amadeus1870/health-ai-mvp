import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface MarkdownTextProps {
    children: string;
    style?: TextStyle | TextStyle[]; // Base text style (color, fontSize, etc.)
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ children, style }) => {
    // Extract color and fontSize from style to apply to markdown rules
    const flattenedStyle = StyleSheet.flatten(style || {});
    const color = flattenedStyle.color || Colors.text;
    const fontSize = flattenedStyle.fontSize || 16;
    const fontFamily = flattenedStyle.fontFamily || Typography.fontFamily.regular;

    const markdownStyles = StyleSheet.create({
        body: {
            color: color as string,
            fontSize: fontSize as number,
            fontFamily: fontFamily as string,
            lineHeight: (fontSize as number) * 1.5,
        },
        strong: {
            fontFamily: Typography.fontFamily.bold,
            color: color as string,
        },
        em: {
            fontFamily: Typography.fontFamily.regular,
            fontStyle: 'italic',
            color: color as string,
        },
        heading1: {
            fontSize: (fontSize as number) * 1.5,
            fontFamily: Typography.fontFamily.bold,
            color: color as string,
            marginBottom: 10,
        },
        heading2: {
            fontSize: (fontSize as number) * 1.25,
            fontFamily: Typography.fontFamily.bold,
            color: color as string,
            marginBottom: 8,
        },
        bullet_list: {
            marginBottom: 8,
        },
        ordered_list: {
            marginBottom: 8,
        },
        list_item: {
            marginBottom: 4,
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        // Remove margins from paragraphs to avoid excessive spacing in cards
        paragraph: {
            marginTop: 0,
            marginBottom: 8,
        },
    });

    return (
        <Markdown style={markdownStyles}>
            {children}
        </Markdown>
    );
};
