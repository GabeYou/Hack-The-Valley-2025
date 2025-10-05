'use client'

import { useEffect, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, Typography, Box } from "@mui/material"

import Navbar from "@/components/Navbar"

type Task = {
  id: string
  title: string
  description: string
  location: string // "lat,lng"
  bountyTotal?: number
}

export default function BountiesMap() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  useEffect(() => {
    fetch("/api/task") // ✅ Changed route
      .then((res) => res.json())
      .then((data) => {
        setTasks(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading || !isLoaded) return <div>Loading map...</div>
  if (tasks.length === 0) return <div>No tasks found.</div>

  const firstLocation = tasks[0].location.split(",").map(Number)
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
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 64px)",
          marginTop: "64px",
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
            {tasks.map((task) => {
              const [lat, lng] = task.location.split(",").map(Number)
              return (
                <Marker
                  key={task.id}
                  position={{ lat, lng }}
                  onClick={() => setSelectedTask(task)}
                />
              )
            })}

            {selectedTask && (
              <InfoWindow
                position={{
                  lat: Number(selectedTask.location.split(",")[0]),
                  lng: Number(selectedTask.location.split(",")[1]),
                }}
                onCloseClick={() => setSelectedTask(null)}
              >
                <div>
                  <h3>{selectedTask.title}</h3>
                  <p>{selectedTask.description}</p>
                  {selectedTask.bountyTotal && (
                    <Typography variant="body2">
                      Total: {selectedTask.bountyTotal} credits
                    </Typography>
                  )}
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
            backgroundColor: "#d8ffb1",
            borderLeft: "1px solid #ddd",
            padding: "1rem",
            boxSizing: "border-box",
          }}
        >
          <Typography variant="h6" color="black" sx={{ mb: 2 }}>
            Available Tasks
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {tasks.map((task) => (
              <Card
                key={task.id}
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
                onClick={() => setSelectedTask(task)}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {task.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </div>
      </div>
    </>
  )
}
