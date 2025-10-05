'use client'

import { useEffect, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, Typography, Box } from "@mui/material"

type Bounty = {
  id: string
  title: string
  description: string
  location: string // "lat,lng"
}

export default function BountiesMap() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  useEffect(() => {
    fetch("/api/bounties")
      .then((res) => res.json())
      .then((data) => {
        setBounties(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading || !isLoaded) return <div>Loading map...</div>
  if (bounties.length === 0) return <div>No bounties found.</div>

  const firstLocation = bounties[0].location.split(",").map(Number)
  const center = { lat: firstLocation[0], lng: firstLocation[1] }

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  }

  const cleanMapStyle = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", stylers: [{ visibility: "off" }] },
    { featureType: "landscape", stylers: [{ visibility: "simplified" }] },
    { featureType: "water", stylers: [{ visibility: "simplified" }] },
  ]

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 64px)", // reserve 64px for navbar
        marginTop: "64px", // push below navbar
      }}
    >
      {/* Map Section (70%) */}
      <div style={{ width: "70%", height: "100%" }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={center}
          options={{
            styles: cleanMapStyle,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {bounties.map((bounty) => {
            const [lat, lng] = bounty.location.split(",").map(Number)
            return (
              <Marker
                key={bounty.id}
                position={{ lat, lng }}
                onClick={() => setSelectedBounty(bounty)}
              />
            )
          })}

          {selectedBounty && (
            <InfoWindow
              position={{
                lat: Number(selectedBounty.location.split(",")[0]),
                lng: Number(selectedBounty.location.split(",")[1]),
              }}
              onCloseClick={() => setSelectedBounty(null)}
            >
              <div>
                <h3>{selectedBounty.title}</h3>
                <p>{selectedBounty.description}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Right Panel (30%) */}
      <div
        style={{
          width: "30%",
          height: "100%",
          overflowY: "auto",
          backgroundColor: "#fafafa",
          borderLeft: "1px solid #ddd",
          padding: "1rem",
          boxSizing: "border-box",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Available Bounties
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          {bounties.map((bounty) => (
            <Card
              key={bounty.id}
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#f0f0f0",
                },
              }}
              onClick={() => {
                const [lat, lng] = bounty.location.split(",").map(Number)
                setSelectedBounty(bounty)
                // optional: you could also recenter the map here
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {bounty.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {bounty.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </div>
    </div>
  )
}
