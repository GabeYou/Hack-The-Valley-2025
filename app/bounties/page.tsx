'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, Typography, Box, Button, CardMedia, ToggleButton, ToggleButtonGroup } from "@mui/material"

import Navbar from "@/components/Navbar"

// Updated Task type to include a photo
type Task = {
  id: string
  title: string
  description: string
  location: string // "lat,lng"
  bountyTotal?: number
  links?: any // Optional photo URL
}

export default function BountiesMap() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  // State to store fetched street addresses for tasks
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null)
  const [filter, setFilter] = useState<'all' | 'contributed' | 'volunteering'>('all');
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  })

  // Initialize the geocoder once the Google Maps script is loaded
  useEffect(() => {
    if (isLoaded) {
      setGeocoder(new window.google.maps.Geocoder())
    }
  }, [isLoaded])

  // Fetch tasks from the API
  useEffect(() => {
    fetch("/api/task")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch tasks:", err)
        setLoading(false)
      })
  }, [])

  // Fetch user data for contributions and volunteered tasks
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch((err) => console.error("Failed to fetch user data:", err));
  }, []);

  // Geocode task locations to get street addresses
  useEffect(() => {
    if (geocoder && tasks.length > 0) {
      const geocodePromises = tasks.map((task) => {
        const [lat, lng] = task.location.split(",").map(Number)
        return new Promise<[string, string]>((resolve) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              // Resolve with task ID and the formatted address
              resolve([task.id, results[0].formatted_address])
            } else {
              // Handle cases where geocoding fails
              console.log(`Geocode was not successful for the following reason: ${status}`)
              resolve([task.id, "Address not available"])
            }
          })
        })
      })

      // After all geocoding requests are complete, update the addresses state
      Promise.all(geocodePromises).then((addressResults) => {
        setAddresses(Object.fromEntries(addressResults))
      })
    }
  }, [tasks, geocoder])

  // Filtering logic
  let filteredTasks = tasks;
  if (filter === 'all') {
    filteredTasks = tasks.filter((t) => t.status === 'open');
  } else if (filter === 'contributed' && userData) {
    const contributedIds = new Set(userData.contributions?.map((c: any) => c.taskId));
    filteredTasks = tasks.filter((t) => contributedIds.has(t.id));
  } else if (filter === 'volunteering' && userData) {
    const volunteeringIds = new Set(userData.volunteeredTasks?.map((v: any) => v.taskId));
    filteredTasks = tasks.filter((t) => volunteeringIds.has(t.id));
  }

  if (loading || !isLoaded) return <div>Loading map...</div>
  if (tasks.length === 0) return <div>No tasks found.</div>

  const firstLocation = tasks[0].location.split(",").map(Number)
  const center = { lat: firstLocation[0], lng: firstLocation[1] }

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  }

  // A clean map style to hide unnecessary labels and features
  const cleanMapStyle = [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", stylers: [{ visibility: "off" }] },
    { featureType: "landscape", stylers: [{ visibility: "simplified" }] },
    { featureType: "water", stylers: [{ visibility: "simplified" }] },
  ]
  const handleAcceptBounty = async (taskId: string) => {
    try {
      const res = await fetch("/api/task/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        alert("Bounty accepted successfully!");
        setSelectedTask(null);
        // Optionally refresh tasks so the status updates
        const updatedTasks = tasks.map(t =>
          t.id === taskId ? { ...t, status: "in_progress" } : t
        );
        setTasks(updatedTasks);
      } else {
        alert(data.error || "Failed to accept bounty.");
      }
    } catch (err) {
      console.error(err);
      alert("Error accepting bounty.");
    }
  };
  
  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 64px)", // Full height minus navbar
        }}
      >
        {/* Map Section (70%) */}
        <div style={{ width: "70%", height: "100%" }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={13}
            center={center}
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
            {/* Render a marker for each filtered task */}
            {filteredTasks.map((task) => {
              const [lat, lng] = task.location.split(",").map(Number)
              return (
                <Marker
                  key={task.id}
                  position={{ lat, lng }}
                  onClick={() => setSelectedTask(task)}
                />
              )
            })}

            {/* Show an InfoWindow when a task is selected */}
            {selectedTask && (
  <InfoWindow
    position={{
      lat: Number(selectedTask.location.split(",")[0]),
      lng: Number(selectedTask.location.split(",")[1]),
    }}
    onCloseClick={() => setSelectedTask(null)}
    options={{ maxWidth: 300 }}
  >
    <div style={{ padding: "15px", maxWidth: "300px", fontFamily: "Arial, sans-serif" }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        {selectedTask.title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {selectedTask.description}
      </Typography>
      {selectedTask.bountyTotal ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Total: {selectedTask.bountyTotal} credits
        </Typography>
      ):<></>}

      <Button
        variant="contained"
        sx={{
          backgroundColor: "#22c55e",
          "&:hover": { backgroundColor: "#16a34a" },
          fontWeight: "bold",
          width: "100%",
        }}
        onClick={() => handleAcceptBounty(selectedTask.id)}
      >
        Accept Bounty
      </Button>
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
            backgroundColor: "#d8ffb1",
            borderLeft: "1px solid #ddd",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sticky Header */}
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #b5d996",
              backgroundColor: "#c2f293", 
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 1,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="h5" color="#2f6d23" sx={{ fontWeight:500,mb: 0}}>
              Available Bounties
            </Typography>
            <Button
              sx={{backgroundColor:'#2f6d23'}}
              variant="contained"
              color="primary"
              onClick={() => router.push("/bountysignup")}
            >
              Create a Bounty
            </Button>
          </div>
          {/* Filter Switch */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(_, val) => val && setFilter(val)}
              size="small"
              color="success"
            >
              <ToggleButton value="all">All Open Tasks</ToggleButton>
              <ToggleButton value="contributed">My Tasks</ToggleButton>
              <ToggleButton value="volunteering">Volunteering</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {/* Scrollable Card List */}
          <div
            style={{
              overflowY: "auto", // Make only this container scrollable
              flex: 1, // Allow this container to grow and fill available space
              padding: "1rem",
            }}
          >
            <Box display="flex" flexDirection="column" gap={2}>
              {filteredTasks.map((task) => (
               <Card
               key={task.id}
               variant="outlined"
               sx={{
                 cursor: "pointer",
                 backgroundColor: "#fff",
                 border: "2px solid rgb(47, 109, 35)",
                 borderRadius: "12px",
                 boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                 transition: "all 0.2s ease-in-out",
                 "&:hover": {
                   backgroundColor: "#f9f9f9",
                   borderColor: "rgb(34, 78, 25)",
                   boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                   transform: "translateY(-2px)",
                 },
               }}
               onClick={() => setSelectedTask(task)}
             >
             
                  {/* Display photo if available */}
                  {task.links[0] && (
                    <CardMedia
                    style={{padding: '10px'}}
                      component="img"
                      height="140"
                      image={task.links[0]?.url}
                      alt={`Photo for ${task.title}`}
                    />
                  )}
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {task.title}
                    </Typography>
                    {/* Display the fetched street address */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {addresses[task.id] || "Loading address..."}
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
      </div>
    </>
  )
}
