import { createTheme } from '@mui/material/styles'

 const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#22c55e', // Tailwind green-500 equivalent
    },
    secondary: {
      main: '#86efac', // Tailwind green-200 equivalent
    },
    background: {
      default: '#ffffff', // matches --background
      paper: '#f9f9f9',   // subtle variation for cards
    },
    text: {
      primary: '#171717', // matches --foreground
      secondary: '#4b5563', // Tailwind gray-600
    },
  },
  typography: {
    fontFamily: '"Arial", "Helvetica", sans-serif',
  },
})

// Dark mode version
 const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22c55e',
    },
    secondary: {
      main: '#86efac',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ededed',
      secondary: '#9ca3af', // Tailwind gray-400
    },
  },
  typography: {
    fontFamily: '"Arial", "Helvetica", sans-serif',
  },
})

export { lightTheme, darkTheme }
