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
      deepColorDisabled: {
        default: 'deep.700',
        _dark: 'deep.700',
      },
      deepBgHover: {
        default: 'deep.100',
        _dark: 'deep.800',
      },
      deepColorHover: {
        default: 'deep.900',
        _dark: 'deep.50',
      },
      deepBgDanger: {
        default: 'danger.50',
        _dark: 'danger.800',
      },
      deepColorDanger: {
        default: 'danger.900',
        _dark: 'danger.50',
      },
      deepBgDangerHover: {
        default: 'danger.100',
        _dark: 'danger.800',
      },
      deepBgActive: {
        default: 'deep.100',
        _dark: 'deep.800',
      },
      deepColorActive: {
        default: '#00438F',
        _dark: 'cyan',
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
    danger: {
      50: '#edd2d2',
      100: '#EE7474',
      200: '#D26969',
      300: '#BB3737', //
      400: '#AD2626',
      500: '#881111', //
      600: '#6B0A0A',
      700: '#440606',
      800: '#3c1515',
      900: '#1F0505',
    },
  },
  components: {
    Popover: {
      baseStyle: {
        content: {
          borderRadius: 0,
        },
      },
    },
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
        danger: {
          bg: 'deepBgDanger',
          color: 'deepColorDanger',
          _hover: {
            bg: 'deepBgDangerHover',
          },
        },
        disabled: {
          bg: 'deepBg',
          color: 'deepColorDisabled',
          _hover: {
            bg: 'deepBg',
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