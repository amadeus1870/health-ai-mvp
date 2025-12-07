import React from 'react';
import { View } from 'react-native';

/**
 * This is a dummy component used solely to register the "upload_placeholder" route
 * in the Tabs layout. The actual tab button is overridden in _layout.tsx to
 * perform a navigation action instead of rendering this screen.
 */
export default function UploadPlaceholderScreen() {
    return <View />;
}
