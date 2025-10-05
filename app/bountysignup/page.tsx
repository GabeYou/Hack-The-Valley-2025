'use client'

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import {
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

export default function CreateBountyPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [mapCenter, setMapCenter] = useState({ lat: 43.6532, lng: -79.3832 })
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [amountToAdd, setAmountToAdd] = useState('')
  const [address, setAddress] = useState('')
  const [form, setForm] = useState({ title: '', description: '', bountyTotal: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/task`)
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  useEffect(() => {
    fetchTasks()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setMapCenter(loc)
          setMarker(loc)
          fetchAddress(loc.lat, loc.lng)
        },
        () => {},
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await res.json()
      setAddress(data.results?.[0]?.formatted_address || 'Unknown location')
    } catch {
      setAddress('Failed to fetch address')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!marker) return setMessage('Please select a location.')

    setLoading(true)
    try {
      const res = await fetch(`/api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          lat: marker.lat,
          lon: marker.lng,
          bountyTotal: Number(form.bountyTotal),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`✅ Task created: ${data.task.title}`)
        setForm({ title: '', description: '', bountyTotal: '' })
        setMarker(null)
        fetchTasks()
      } else {
        setMessage(data.error || 'Failed to create task.')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error creating task.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFunds = async () => {
    if (!selectedTask) return
    try {
      const res = await fetch(`/api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          taskId: selectedTask.id,
          amount: Number(amountToAdd),
        }),
      })
      if (res.ok) {
        setMessage(`✅ Added ${amountToAdd} credits to "${selectedTask.title}"`)
        setSelectedTask(null)
        setAmountToAdd('')
        fetchTasks()
      } else {
        setMessage('Failed to add contribution.')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error adding contribution.')
    }
  }

  if (!isLoaded)
    return <CircularProgress sx={{ margin: '2rem auto', display: 'block' }} />

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          zoom={13}
          center={mapCenter}
          onClick={(e) => {
            if (e.latLng) {
              const newMarker = { lat: e.latLng.lat(), lng: e.latLng.lng() }
              setMarker(newMarker)
              setMapCenter(newMarker)
              fetchAddress(newMarker.lat, newMarker.lng)
            }
          }}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              { featureType: 'poi', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit', stylers: [{ visibility: 'off' }] },
              // Keep default map look, just muted labels
              { elementType: 'labels.text.fill', stylers: [{ color: '#555' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
            ],
          }}
        >
          {/* Existing Tasks */}
          {tasks.map((t) => {
            const [lat, lng] = t.location.split(',').map(Number)
            return (
              <Marker
                key={t.id}
                position={{ lat, lng }}
                onClick={() => setSelectedTask(t)}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                }}
              />
            )
          })}

          {/* Selected Marker */}
          {marker && (
            <Marker
              position={marker}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* 🧾 Form */}
      <div
        style={{
          flex: 1,
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
        }}
      >
        <Paper
          elevation={4}
          style={{
            padding: '2rem',
            width: '100%',
            maxWidth: '480px',
            borderRadius: '16px',
            border: '2px solid #2f6d23',
          }}
        >
          <Typography variant='h5' gutterBottom sx={{ fontWeight: '600', color: '#2f6d23' }}>
            Create a New Task
          </Typography>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TextField
              label='Title'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label='Description'
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label='Task Total (credits)'
              type='number'
              value={form.bountyTotal}
              onChange={(e) => setForm({ ...form, bountyTotal: e.target.value })}
              required
            />
            {marker && (
              <Typography variant='body2' color='text.secondary'>
                📍 {address}
              </Typography>
            )}
            <Button
              type='submit'
              variant='contained'
              disabled={loading}
              sx={{
                backgroundColor: '#2f6d23',
                '&:hover': { backgroundColor: '#25551b' },
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </form>

          {message && (
            <Typography
              variant='body2'
              sx={{
                marginTop: '1rem',
                color: message.startsWith('✅') ? '#2f6d23' : 'red',
              }}
            >
              {message}
            </Typography>
          )}
        </Paper>
      </div>

      {/* 💬 Add Funds Dialog */}
      <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)}>
        <DialogTitle>Add to "{selectedTask?.title}"</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ marginBottom: '1rem' }}>
            Current total: {selectedTask?.bountyTotal || 0} credits
          </Typography>
          <TextField
            label='Amount to add'
            type='number'
            value={amountToAdd}
            onChange={(e) => setAmountToAdd(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTask(null)}>Cancel</Button>
          <Button
            onClick={handleAddFunds}
            variant='contained'
            sx={{
              backgroundColor: '#2f6d23',
              '&:hover': { backgroundColor: '#25551b' },
              color: '#fff',
            }}
          >
            Add Funds
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
