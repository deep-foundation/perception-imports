import React from 'react';
import {
  extendTheme, type ThemeConfig,
  useColorMode,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
import { defineStyle, defineStyleConfig } from "@chakra-ui/styled-system";
import { mode, StyleFunctionProps } from '@chakra-ui/theme-tools';

export const ColorMode = ({
  dark, light,
  ...props
}: {
  dark: any;
  light: any;
  [key: string]: any;
}) => {
  const text = useColorModeValue("dark", "light");
  const custom = useColorModeValue(dark, light);
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button
      onClick={toggleColorMode}
      {...props}
      {...custom}
    />
  )
}

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
  cssVarPrefix: 'deepCase',
}

const theme = extendTheme({
  config,
  semanticTokens: {
    colors: {
      deepBg: {
        default: 'deep.50',
        _dark: 'deep.900',
      },
      deepColor: {
        default: 'deep.900',
        _dark: 'deep.50',
      },
      deepBgActive: {
        default: 'deep.50',
        _dark: 'deep.900',
      },
      deepColorActive: {
        default: '#00438F',
        _dark: 'cyan',
      },
      deepBgHover: {
        default: 'deep.100',
        _dark: 'deep.800',
      },
      deepColorHover: {
        default: 'deep.900',
        _dark: 'deep.50',
      },
      deepBgActiveHover: {
        default: 'deep.100',
        _dark: 'deep.800',
      },
      deepColorActiveHover: {
        default: '#00438F',
        _dark: 'cyan',
      },
    }
  },
  colors: {
    deep: {
      50: '#EBF8FF',
      100: '#BEE3F8',
      200: '#19202B',
      300: '#19202B', //
      400: '#4299E1',
      500: '#BEE3F8', //
      600: '#2B6CB0',
      700: '#2C5282',
      800: '#1B2535',
      900: '#19202B',
    },
  },
  components: {
    Input: {
      baseStyle: {
        field: {
          borderRadius: 0,
          color: 'deepColor'
        },
      },
    },
    Button: {
      baseStyle: {
        borderRadius: 0,
      },
      variants: {
        solid: {
          bg: 'deepBg',
          color: 'deepColor',
          _hover: {
            bg: 'deepBgHover',
          },
        },
        active: {
          bg: 'deepBgActive',
          color: 'deepColorActive',
          _hover: {
            bg: 'deepBgActiveHover',
          },
        },
        // baseStyle: (props: StyleFunctionProps) => ({
        //   color: mode('red', 'green')(props),
        // }),
      },
    },
  }
});

export default theme;