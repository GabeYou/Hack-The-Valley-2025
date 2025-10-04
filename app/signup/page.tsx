'use client'

import * as React from 'react'
import {
  Box, Button, Container, CssBaseline, TextField,
  Typography, Avatar, createTheme, ThemeProvider, Alert
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { green } from '@mui/material/colors'
import { useRouter } from 'next/navigation'
import { lightTheme } from '../themes'

const theme = lightTheme


export default function SignUpPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const data = new FormData(event.currentTarget)
    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      password: data.get('password'),
      phoneNumber: data.get('phoneNumber'),
      address: data.get('address'),
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Registration failed')
      }

      setSuccess(true)

      // Redirect to login page after short delay
      setTimeout(() => {
        router.push('/login')
      }, 1200)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign Up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
            <TextField margin="normal"  autoComplete="off" required fullWidth id="name" label="Full Name" name="name" autoFocus />
            <TextField margin="normal"  autoComplete="off" required fullWidth id="email" label="Email Address" name="email" />
            <TextField margin="normal"  autoComplete="off" required fullWidth id="password" label="Password" name="password" type="password" />
            <TextField margin="normal"  autoComplete="off" fullWidth id="phoneNumber" label="Phone Number" name="phoneNumber" />
            <TextField margin="normal"  autoComplete="off" fullWidth id="address" label="Address" name="address" />

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>Registered successfully! </Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>Redirecting to login </Alert>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
