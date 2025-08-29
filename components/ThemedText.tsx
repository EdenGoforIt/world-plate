import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const getTypeClasses = () => {
    switch (type) {
      case 'title':
        return 'text-[32px] font-bold leading-8';
      case 'defaultSemiBold':
        return 'text-base leading-6 font-semibold';
      case 'subtitle':
        return 'text-xl font-bold';
      case 'link':
        return 'text-base leading-[30px]';
      default:
        return 'text-base leading-6';
    }
  };

  return (
    <Text
      className={getTypeClasses()}
      style={[
        { color: type === 'link' ? '#0a7ea4' : color },
        style,
      ]}
      {...rest}
    />
  );
}

