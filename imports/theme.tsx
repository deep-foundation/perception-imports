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

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: true,
    cssVarPrefix: 'deepCase',
  },
  semanticTokens: {
    colors: {
      deepBgGraphChildren: {
        default: 'black',
        _dark: 'white',
      },
      deepBg: {
        default: 'deep.50',
        _dark: 'deep.900',
      },
      deepBgDark: {
        default: 'white',
        _dark: 'deep.950',
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
      deepBgDangerActive: {
        default: 'danger.100',
        _dark: 'danger.900',
      },
      deepColorDangerActive: {
        default: 'danger.900',
        _dark: 'danger.50',
      },
      deepBgDangerActiveHover: {
        default: 'danger.200',
        _dark: 'danger.700',
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
      deepLine: {
        default: 'deep.100',
        _dark: 'deep.800',
      },
      deepLinkNodeBg: {
        default: 'deep.900',
        _dark: 'white',
      },
      deepLinkNodeColor: {
        default: 'deep.950',
        _dark: 'deep.50',
      },
      deepLinkNodeBgActive: {
        default: 'deep.800',
        _dark: 'deep.100',
      },
      deepLinkNodeColorActive: {
        default: 'deep.950',
        _dark: 'cyan',
      },
      splash: {
        default: '#0D1117',
        _dark: 'deep.50',
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
      950: '#0000004d',
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
        header: {
          border: 0,
        },
        content: {
          boxShadow: 'dark-lg',
          border: 0,
          borderRadius: 0,
          bg: 'deepBg',
          color: 'deepColor',
        },
        arrow: {
          bg: 'deepColorActive',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 0,
          color: 'deepColor',
          p: '1em',
        },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: 0,
        color: 'deepColor',
        p: '1em',
      },
    },
    Modal: {
      baseStyle: {
        header: {
          position: 'absolute',
          bottom: '100%',
          left: 0,
          p: 0,
        },
        dialog: {
          borderRadius: 0,
          bg: 'deepBg'
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
        dangerActive: {
          bg: 'deepBgDangerActive',
          color: 'deepColorDangerActive',
          _hover: {
            bg: 'deepBgDangerActiveHover',
          },
        },
        disabled: {
          bg: 'deepBg',
          color: 'deepColorDisabled',
          _hover: {
            bg: 'deepBg',
          },
        },
        planet: {
          bg: 'deepBg',
          color: 'deepColor',
          opacity: 0.8,
          borderColor: 'deepColor',
          borderStyle: 'deshed',
          borderWidth: '1px',
          borderRadius: '50%',
          height: '3em', width: '3em',
          _hover: {
            bg: 'deepBgDark',
          },
        },
        planetActive: {
          bg: '#ffffff42',
          color: 'deepColorActive',
          opacity: 0.8,
          borderColor: 'deepColor',
          borderStyle: 'deshed',
          borderWidth: '1px',
          borderRadius: '50%',
          height: '3em', width: '3em',
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