'use client'

import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
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
  Box,
  ThemeProvider,
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import { lightTheme } from '../themes'

export default function CreateBountyPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [showBountyInput, setShowBountyInput] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 43.6532, lng: -79.3832 })
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [amountToAdd, setAmountToAdd] = useState('')
  const [address, setAddress] = useState('')
  const [form, setForm] = useState({ title: '', description: '', bountyTotal: '', photoLink: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const fetchTasks = async () => {
    try {
      const res = await fetch(`api/task`)
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }
  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const newMarker = {
          lat: place.geometry.location?.lat() || 0,
          lng: place.geometry.location?.lng() || 0,
        };
        setMarker(newMarker);
        setMapCenter(newMarker);
        setAddress(place.formatted_address || '');
      }
    }
  };

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
      const res = await fetch(`api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          lat: marker.lat,
          lon: marker.lng,
          bountyTotal: Number(form.bountyTotal),
          links: form.photoLink ? [form.photoLink.trim()] : [],        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessageType('success');
        setMessage(`Task created: ${data.task?.title || form.title}`);
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to create task.');
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
      const res = await fetch(`api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          taskId: selectedTask.id,
          amount: Number(amountToAdd),
        }),
      })
      if (res.ok) {
        setMessage(`Added ${amountToAdd} credits to "${selectedTask.title}"`)
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
    < >
    <Navbar />
    <div
    style={{
      display: 'flex',
      height: 'calc(100vh - 64px)',
      background: '#f5f5f5',
    }}
  >
  {/* Fullscreen Map Container */}
<div style={{ position: 'relative', flex: 1 }}>
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
      disableDefaultUI: true,         // disables all controls initially
      zoomControl: true,              // re-enable zoom buttons
      mapTypeControl: true,           // re-enable satellite toggle
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DEFAULT,
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      fullscreenControl: false,
      streetViewControl: false,
      scaleControl: false,
      rotateControl: false,
      clickableIcons: false,          // disables default POI clicks
    
      styles: [
        // Hide all points of interest (businesses, landmarks, etc.)
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    
        // Hide transit stops, bus routes, etc.
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    
        // Hide road labels for a cleaner look
        { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    
        // Desaturate land colors slightly for clarity
        { elementType: 'geometry', stylers: [{ saturation: -10 }] },
    
        // Improve label legibility
        { elementType: 'labels.text.fill', stylers: [{ color: '#555' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
      ],
    }}
    
  >
    {tasks.map((t) => {
      const [lat, lng] = t.location?.split(',').map(Number)
      return (
        <Marker
          key={t.id}
          position={{ lat, lng }}
          onClick={() => setSelectedTask(t)}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
        />
      )
    })}
    {marker && (
      <Marker
        position={marker}
        icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
      />
    )}
  </GoogleMap>

  {/* Floating Form Panel */}
  <Paper
    elevation={5}
    style={{
      position: 'absolute',
      top: '5%',
      right: '1%',
      width: '380px',
      padding: '1.75rem',
      backgroundColor: '#ffffffee', // translucent for map visibility
      borderRadius: '16px',
      border: '2px solid #2f6d23',
      backdropFilter: 'blur(6px)',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Typography variant="h5" sx={{ fontWeight: '600', color: '#2f6d23' }}>
      Create a New Task
    </Typography>

    <Typography
      variant="body2"
      sx={{
        color: '#2f6d23',
        cursor: 'pointer',
        textDecoration: 'underline',
        fontWeight: 'bold',
      }}
      onClick={() => setInstructionsOpen(true)}
    >
      Instructions
    </Typography>
  </Box>

    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TextField
        label="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        fullWidth
      />
      <TextField
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
        fullWidth
        multiline
        rows={3}
      />
      

      <Autocomplete onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)} onPlaceChanged={handlePlaceChanged}>
        <TextField label="Location" value={address} onChange={(e) => setAddress(e.target.value)} required fullWidth />
      </Autocomplete>
      <TextField
      label="Photo Link "
      placeholder="https://example.com/photo.jpg"
      value={form.photoLink}
      onChange={(e) => setForm({ ...form, photoLink: e.target.value })}
      fullWidth
      />
      {!showBountyInput ? (
        <Typography
          variant="body2"
          sx={{
            color: '#2f6d23',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: 'bold',
          }}
          onClick={() => setShowBountyInput(true)}
        >
          Add Initial Contribution
        </Typography>
      ) : (
        <TextField
          label="Task Total (credits)"
          type="number"
          value={form.bountyTotal}
          onChange={(e) => setForm({ ...form, bountyTotal: e.target.value })}
          fullWidth
        />
      )}

      <Button
        type="submit"
        onClick={() => setShowBountyInput(false)}
        variant="contained"
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
        variant="body2"
        sx={{
          marginTop: '1rem',
          color: messageType === 'success' ? '#2f6d23' : 'red',
        }}
      >
        {message}
      </Typography>
    )}
  </Paper>
</div>

{/* Instructions Modal */}
<Dialog open={instructionsOpen} onClose={() => setInstructionsOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ fontWeight: 600, color: '#2f6d23' }}>
    How to Use This Map
  </DialogTitle>
  <DialogContent dividers>
    <Typography variant="body1" gutterBottom>
      <strong>Map Controls:</strong> Click on the map to set a location for your task. Use the zoom buttons and the map/satellite toggle to adjust your view.
    </Typography>
    <Typography variant="body1" gutterBottom>
      <strong>Create a Task:</strong> Fill in the title, description, and location. Optionally add an initial bounty. Click "Create Task" to add it to the map.
    </Typography>
    <Typography variant="body1" gutterBottom>
      <strong>Contributing to Tasks:</strong> Click on an existing marker to see the task details and add funds.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setInstructionsOpen(false)} sx={{ color: '#2f6d23' }}>
      Close
    </Button>
  </DialogActions>
</Dialog>
    {/* Contribute Dialog */}
    <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', padding: '1.5rem', backgroundColor: '#f9f9f9' } }}>
      <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#2f6d23', textAlign: 'center', pb: 1 }}>
        <ChatBubbleOutlineIcon sx={{ mr: 1 }} /> Contribute to "{selectedTask?.title}"
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, px: 3, pb: 1 }}>
        <Paper elevation={0} sx={{ backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '12px', padding: '1.25rem' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2f6d23', mb: 1 }}>
            Description
          </Typography>
          <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.5 }}>
            {selectedTask?.description || 'No description available.'}
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2f6d23', mt: 2 }}>
            Current Bounty
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <AttachMoneyIcon color="success" />
            <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>
              {selectedTask?.bountyTotal || 0} credits
            </Typography>
          </Box>
        </Paper>

        <TextField label="Amount to Contribute" type="number" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} fullWidth sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
      </DialogContent>

      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 3, pb: 2, pt: 1 }}>
        <Button onClick={() => setSelectedTask(null)} sx={{ color: '#555', fontWeight: 500, textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleAddFunds} variant="contained" sx={{ backgroundColor: '#2f6d23', '&:hover': { backgroundColor: '#25551b' }, color: '#fff', fontWeight: 600, borderRadius: '10px', px: 3 }}>Add Funds</Button>
      </DialogActions>
    </Dialog>
  </div>
    
    </>
  )
}
