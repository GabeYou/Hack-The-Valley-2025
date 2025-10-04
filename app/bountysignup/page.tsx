'use client'

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { TextField, Button, Typography, Paper } from "@mui/material"
import { useState } from "react"

export default function CreateBountyPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  // Default map center (Toronto in this case)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 43.6532,
    lng: -79.3832,
  })

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    bountyTotal: "",
  })
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!marker) {
      setMessage("Please select a location on the map.")
      return
    }

    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // include JWT cookie
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          lat: marker.lat,
          lon: marker.lng,
          bountyTotal: Number(form.bountyTotal),
        }),
      })

      if (res.ok) {
        setMessage("Bounty created successfully! 🎉")
        setForm({ title: "", description: "", bountyTotal: "" })
        setMarker(null)
      } else {
        const err = await res.json()
        setMessage(err.error || "Failed to create bounty.")
      }
    } catch (err) {
      console.error(err)
      setMessage("Error creating bounty.")
    }
  }

  if (!isLoaded) return <div>Loading map...</div>

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Map Half */}
      <div style={{ flex: 1 }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          zoom={12}
          center={mapCenter} // <-- controlled by state
          onClick={(e) => {
            if (e.latLng) {
              const newMarker = { lat: e.latLng.lat(), lng: e.latLng.lng() }
              setMarker(newMarker)
              setMapCenter(newMarker) // update map center to where user clicked
            }
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </div>

      {/* Form Half */}
      <div
        style={{
          flex: 1,
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} style={{ padding: "2rem" }}>
          <Typography variant="h5">Create a New Bounty</Typography>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <TextField
              label="Title"
              variant="outlined"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <TextField
              label="Description"
              variant="outlined"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              multiline
              rows={4}
            />
            <TextField
              label="Bounty Total"
              variant="outlined"
              type="number"
              value={form.bountyTotal}
              onChange={(e) =>
                setForm({ ...form, bountyTotal: e.target.value })
              }
              required
            />
            <Button variant="contained" color="primary" type="submit">
              Create Bounty
            </Button>
          </form>

          {marker && (
            <Typography variant="body1" style={{ marginTop: "1rem" }}>
              Selected Location: Latitude {marker.lat}, Longitude {marker.lng}
            </Typography>
          )}

          {message && (
            <Typography variant="body2" style={{ marginTop: "1rem" }}>
              {message}
            </Typography>
          )}
        </Paper>
      </div>
    </div>
  )
}
