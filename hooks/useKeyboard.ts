import { useEffect, useRef } from 'react';
import { Keyboard, Platform, KeyboardEvent } from 'react-native';

export const useKeyboardCache = () => {
  const cacheRef = useRef({
    isVisible: false,
    height: 0,
    topY: 0,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      cacheRef.current.isVisible = true;
      cacheRef.current.height = e.endCoordinates.height;
      cacheRef.current.topY = e.endCoordinates.screenY;
    };

    const onHide = () => {
      cacheRef.current.isVisible = false;
      cacheRef.current.height = 0;
      cacheRef.current.topY = 0;
    };

    const s1 = Keyboard.addListener(showEvent, onShow);
    const s2 = Keyboard.addListener(hideEvent, onHide);

    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  return cacheRef;
};
