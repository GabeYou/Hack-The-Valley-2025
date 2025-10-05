import { createTheme } from '@mui/material/styles'

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#22c55e' },
    secondary: { main: '#86efac' },
    background: { default: '#ffffff', paper: '#f9f9f9' },
    text: { primary: '#171717', secondary: '#4b5563' },
  },
  typography: { fontFamily: '"Arial", "Helvetica", sans-serif' },
  components: {
    MuiInputLabel: {
      styleOverrides: {
        asterisk: {
          color: '#f44336', // red for required fields
        },
      },
    },
  },
})

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#22c55e' },
    secondary: { main: '#86efac' },
    background: { default: '#0a0a0a', paper: '#1a1a1a' },
    text: { primary: '#ededed', secondary: '#9ca3af' },
  },
  typography: { fontFamily: '"Arial", "Helvetica", sans-serif' },
  components: {
    MuiInputLabel: {
      styleOverrides: {
        asterisk: {
          color: '#f44336',
        },
      },
    },
  },
})


export { lightTheme, darkTheme }
