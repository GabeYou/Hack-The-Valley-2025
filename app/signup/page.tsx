'use client'

import * as React from 'react'
import { 
  Box, Button, Container, CssBaseline, TextField, Typography, Avatar, createTheme, ThemeProvider 
} from '@mui/material'
import { green } from '@mui/material/colors'
import LockOutlineIcon from '@mui/icons-material/LockOutline';
// Create a light green theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: green[600],
    },
    secondary: {
      main: green[300],
    },
    background: {
      default: '#f5fff5', // very light green background
    },
  },
})

export default function SignUpPage() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    console.log({
      email: data.get('email'),
      password: data.get('password'),
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlineIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign Up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
