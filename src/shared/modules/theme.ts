import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4C84FF',
    },
    warning: {
      main: '#d68d06',
    },
    grey: {
      500: '#787c7e',
    },
    info: {
      main: '#333'
    },
  },
  typography: {
    fontFamily: "'SUIT', sans-serif",
    fontWeightBold: 900,
    fontWeightRegular: 700,
    fontWeightMedium: 700,
    fontWeightLight: 600
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16
        },
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        title: {
          fontSize: 20
        },
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            minHeight: 24,
            height: 40,
          }
        }),
      }
    },
    MuiTab: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            minHeight: 'auto',
            fontSize: 12,
          }
        }),
      }
    },

    MuiButton: {
      variants: [
        {
          props: { size: 'small' },
          style: (props) => ({
            minWidth: 30,
            height: 36,
            borderRadius: 8,
            [props.theme.breakpoints.down('md')]: {
              height: 24,
              fontSize: 11,
              minWidth: 28,
              borderRadius: 4,
            }
          }),
        },
        {
          props: { size: 'medium' },
          style: props => ({
            height: 40, borderRadius: 12, fontSize: 15, lineHeight: 1,
            [props.theme.breakpoints.down('md')]: {
              height: 32,
              fontSize: 13,
              minWidth: 28,
              borderRadius: 8,
            }
          }),
        },
        {
          props: { size: 'large' },
          style: props => ({
            height: 52, borderRadius: 16, fontSize: 15, fontWeight: 'bold',
            [props.theme.breakpoints.down('md')]: {
              height: 40,
              fontSize: 14,
              
              borderRadius: 12,
            }
          })
        }
      ],
    },

    MuiDialog: {
      styleOverrides: {
        paper: (props) => ({
          minWidth: 500,
          borderRadius: 20,
          overflow: 'hidden',
          [props.theme.breakpoints.down('md')]: {
            padding: 1,
            minWidth: 'auto',
            width: '80vw'
          }
        })
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 14,
            padding: 16,
            paddingBlock: 12
          }
        })
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            padding: 16,
            paddingTop: 0,
          }
        })
      }
    },
    MuiInputLabel: {
      styleOverrides: {

        root: props => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 14,
          }
        })
      }
    },
    MuiTextField: {
      variants: [
        {
          props: { variant: 'standard' },
          style: props => ({
            [props.theme.breakpoints.down('md')]: {
              '.MuiFormLabel-root': { fontSize: 13 },
              '.MuiInput-input': { paddingInline: 2 }
            }
          })
        }
      ],
    },
    MuiInputBase: {
      variants: [
        {
          props: { size: 'small' },
          style: props => ({
            [props.theme.breakpoints.down('md')]: {
              fontSize: 12,
            }
          })
        },
      ],
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 12,
            // padding: 4
          }
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: props => ({
            borderRadius: 8,
            boxShadow: `0px 0px 6px ${props.theme.palette.divider}`
        })
      }
    },
    MuiList: {
      styleOverrides: {
        root: props => ({
          [props.theme.breakpoints.down('md')]: {
            paddingTop: 4,
            paddingBottom: 4,
          }
        })
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: props => ({
          fontSize: 14,
          [props.theme.breakpoints.down('md')]: {
            fontSize: 12,
            minHeight: 30
          }
        })
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        listbox: props => ({
          [props.theme.breakpoints.down('md')]: {
            paddingBlock: 4
          }
        }),
        option: props => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 13,
            minHeight: 36
          }
        })
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: props => ({
          [props.theme.breakpoints.down('md')]: {
            '.MuiPickersInputBase-root': {
              fontSize: 12,
              '.MuiInputAdornment-root .MuiSvgIcon-root': {
                width: '1rem',
                height: '1rem'
              }
            },
            
          }
        })
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16
        },
        action: {
          marginRight: 0,
          flex: '0 0 auto'
        }
      },
    },
    MuiAlertTitle: {
      styleOverrides: {
        root: props => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 12
          }
        })
      }
    }
  },
})