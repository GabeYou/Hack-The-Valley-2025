'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, Typography, Box, Button, CardMedia, ToggleButton, ToggleButtonGroup, Switch, FormControlLabel, CircularProgress, Modal } from "@mui/material"
import UploadFileIcon from "@mui/icons-material/UploadFile";

import Navbar from "@/components/Navbar"

// Updated Task type to include status
type Task = {
  id: string
  title: string
  description: string
  location: string // "lat,lng"
  bountyTotal?: number
  status?: string
  links?: any
  postedById?: string
}

export default function BountiesMap() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null)
  const [filter, setFilter] = useState<'all' | 'contributed' | 'volunteering'>('all');
  const [userData, setUserData] = useState<any>(null);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofModal, setProofModal] = useState<{ open: boolean; imgUrl: string | null; taskId: string | null }>({ open: false, imgUrl: null, taskId: null });
  const [imageLoaded, setImageLoaded] = useState(false);


  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  })

  useEffect(() => {
    if (isLoaded) setGeocoder(new window.google.maps.Geocoder())
  }, [isLoaded])

  const fetchTasks = (opts?: { withSpinner?: boolean }) => {
    const withSpinner = opts?.withSpinner === true;
    if (withSpinner) setLoading(true);
    fetch("/api/task")
      .then(res => res.json())
      .then(data => {
        setTasks(data);
      })
      .catch(err => {
        console.error("Failed to fetch tasks:", err)
      })
      .finally(() => {
        if (withSpinner) setLoading(false);
      });
  };

  const fetchUser = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch((err) => console.error("Failed to fetch user data:", err));
  };

  // Initial load with spinner
  useEffect(() => {
    fetchTasks({ withSpinner: true });
    fetchUser();
  }, [])

  // Geocode task locations to get street addresses
  useEffect(() => {
    if (geocoder && tasks.length > 0) {
      const geocodePromises = tasks.map(task => {
        const [lat, lng] = task.location.split(",").map(Number)
        return new Promise<[string, string]>(resolve => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              resolve([task.id, results[0].formatted_address])
            } else {
              resolve([task.id, "Address not available"])
            }
          })
        })
      })

      Promise.all(geocodePromises).then(addressResults => {
        setAddresses(Object.fromEntries(addressResults))
      })
    }
  }, [tasks, geocoder])

  const handleConfirmVerification = async (taskId: string | null) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/task/verify/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        alert('Bounty verified successfully!');
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
        setSelectedTask(null);
        setProofModal({ open: false, imgUrl: null, taskId: null });
      } else {
        alert(data.error || 'Failed to verify bounty.');
      }
    } catch (err) {
      console.error(err);
      alert('Error verifying bounty.');
    }
  };

  const handleVerifyBounty = (taskId: string) => {
    const imageUrl = `/api/task/verify/${encodeURIComponent(taskId)}`;
    setProofModal({ open: true, imgUrl: imageUrl, taskId: taskId });
  };

  // Filtering logic
  let filteredTasks = tasks;
  if (showMyTasks) {
    if (userData) {
      filteredTasks = tasks.filter((t) => t.postedById === userData.id);
    } else {
      filteredTasks = []; // No tasks if user data is unavailable
    }
  } else {
    if (filter === "all") {
      filteredTasks = tasks.filter((t) => t.status === "open");
    } else if (filter === "contributed" && userData) {
      const contributedIds = new Set(userData.contributions?.map((c: any) => c.taskId));
      filteredTasks = tasks.filter((t) => contributedIds.has(t.id));
    } else if (filter === "volunteering" && userData) {
      const volunteeringIds = new Set(userData.volunteeredTasks?.map((v: any) => v.taskId));
      filteredTasks = tasks.filter((t) => volunteeringIds.has(t.id));
    }
  }

  if (loading || !isLoaded) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #d8ffb1, #a3ff7c)",
        }}
      >
        <CircularProgress size={60} thickness={4} style={{ marginBottom: "20px" }} />
        <Typography variant="h5" style={{ fontWeight: "bold", color: "#2f6d23" }}>
          Loading Map...
        </Typography>
        <Typography variant="body2" style={{ color: "#2f6d23", marginTop: "8px" }}>
          Please wait while we prepare your bounties
        </Typography>
      </div>
    );
  }
    if (tasks.length === 0) return <div>No tasks found.</div>

  const firstLocation = tasks[0].location.split(",").map(Number)
  const center = { lat: firstLocation[0], lng: firstLocation[1] }
  const mapContainerStyle = { width: "100%", height: "100%" }

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
      case "in_review":
        return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
      case "completed":
        return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
      default:
        return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    }
  };
  
  const getMarkerColorValue = (status: string): string => {
    switch (status) {
      case "in_progress":
        return "#3B82F6"; // blue-500
      case "in_review":
        return "#F59E0B"; // orange-500
      case "completed":
        return "#EF4444"; // red
      default:
        return "#22C55E"; // green
    }
  };
  
  
  const handleAcceptBounty = async (taskId: string) => {
    try {
      const res = await fetch("/api/task/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId }),
      })

      const data = await res.json()
      if (res.ok) {
        alert("Bounty accepted successfully!")
        setSelectedTask(null)
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "in_progress" } : t))
        fetchUser(); // refresh volunteeredTasks for Accepted filter
      } else {
        alert(data.error || "Failed to accept bounty.")
      }
    } catch (err) {
      console.error(err)
      alert("Error accepting bounty.")
    }
  }

  const handleSubmitProof = async (e: React.FormEvent<HTMLFormElement>, taskId: string) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get("file")

    if (!file || !(file instanceof File)) return alert("Please select a file")

    try {
      const uploadData = new FormData()
      uploadData.append("taskId", taskId)
      uploadData.append("file", file)

      const res = await fetch("/api/task/submit", {
        method: "POST",
        body: uploadData,
        credentials: "include",
      })

      const data = await res.json()
      if (res.ok) {
        alert("Proof submitted successfully!")
        setSelectedTask(null)
        setSelectedFile(null)
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "in_review" } : t))
      } else {
        alert(data.error || "Failed to submit proof.")
      }
    } catch (err) {
      console.error(err)
      alert("Error submitting proof.")
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
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
                  icon={{ url: getMarkerColor(task.status || "open") }}
                  onClick={() => {
                    setSelectedTask(task);
                  }}
                />
              )
            })}

            {selectedTask && (
              <InfoWindow
                position={{
                  lat: Number(selectedTask.location.split(",")[0]),
                  lng: Number(selectedTask.location.split(",")[1]),
                }}
                onCloseClick={() => {
                  setSelectedTask(null);
                }}
                options={{ maxWidth: 400 }}
              >
                <div style={{ padding: "15px", maxWidth: "400px" , gap: '10px'}}>
                  <Typography variant="h6" fontWeight="bold">{selectedTask.title}</Typography>
                  <Typography variant="body2">{selectedTask.description}</Typography>
                  {selectedTask?.bountyTotal ? (
                    <Typography variant="body2" color="text.secondary">Total: {selectedTask.bountyTotal} credits</Typography>
                  ):<></>}

                  {showMyTasks ? (
                    <>
                      {selectedTask.status === 'in_review' && (
                        <Button
                        disableRipple
                          variant="contained"
                          color="secondary"
                          sx={{ mt: 2, width: '100%' }}
                          onClick={() => handleVerifyBounty(selectedTask.id)}
                        >
                          Verify Bounty
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {selectedTask.status === "open" && (
                        (userData && selectedTask.postedById === userData.id) ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            You posted this bounty.
                          </Typography>
                        ) : (
                          <Button
                            variant="contained"
                            sx={{ backgroundColor: "#22c55e", "&:hover": { backgroundColor: "#16a34a" }, width: "100%" }}
                            onClick={() => handleAcceptBounty(selectedTask.id)}
                          >
                            Accept Bounty
                          </Button>
                        )
                      )}

                      {selectedTask.status === "in_progress" && (
                        <form
                          onSubmit={(e) => handleSubmitProof(e, selectedTask.id)}
                          style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "10px" }}
                        >
                          {/* Hidden file input */}
                          <input
                            id="proof-upload"
                            name="file"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedFile(file);
                            }}
                          />

                          {/* Upload Button */}
                          <label htmlFor="proof-upload">
                            <Button
                            disableRipple
                            disableTouchRipple
                              variant="contained"
                              component="span"
                              startIcon={<UploadFileIcon />}
                              sx={{
                                backgroundColor: "#f57c00",
                                "&:hover": { backgroundColor: "#ef6c00" },
                                fontWeight: "bold",
                                borderRadius: "8px",
                              }}
                            >
                              Upload Photo Proof
                            </Button>
                          </label>

                          {/* Show selected file name */}
                          {selectedFile && (
                            <Typography variant="body2" sx={{ fontStyle: "italic", fontSize: "0.85rem" }}>
                              {selectedFile.name}
                            </Typography>
                          )}

                          {/* Helper text */}
                          {!selectedFile && (
                            <Typography variant="caption" sx={{ color: "red", fontStyle: "italic" }}>
                              Please upload a photo to submit proof
                            </Typography>
                          )}

                          {/* Submit Button */}
                          <Button
                          disableRipple
                          disableTouchRipple
                            type="submit"
                            variant="contained"
                            sx={{
                              backgroundColor: "#22c55e",
                              "&:hover": { backgroundColor: "#16a34a" },
                              fontWeight: "bold",
                            }}
                            disabled={!selectedFile} // Disable until file is chosen
                          >
                            Submit Proof
                          </Button>
                        </form>
                      )}

                      {selectedTask.status === "in_review" && (
                        <Typography variant="body2" color="warning.main">Proof submitted, awaiting review.</Typography>
                      )}
                    </>
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
            disableRipple
            disableTouchRipple
              sx={{backgroundColor:'#2f6d23'}}
              variant="contained"
              color="primary"
              onClick={() => router.push("/bountysignup")}
            >
              Create a Bounty
            </Button>
          </div>

      
          <div
  style={{
    display: 'flex',
    justifyContent: 'space-evenly',
    borderBottom: '2px solid #b5d996', // light grey bottom border
    paddingBottom: '5px',           // space so it looks nice
  }}
> {/* Filter Switch */}
          {!showMyTasks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 , backgroundColor:'white',border:'2px solid #2f6d23', borderRadius:'5px'}}>
              <ToggleButtonGroup
          
                value={filter}
                exclusive
                onChange={(_, val) => {
                  if (val) {
                    setFilter(val);
                    fetchTasks(); // silent refresh (no spinner)
                    fetchUser();  // ensure volunteered/contributions are fresh for filters
                  }
                }}
                size="small"
                color="success"
              >
                <ToggleButton disableRipple value="all"> Available </ToggleButton>
                <ToggleButton disableRipple value="volunteering">Accepted </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          ):<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1, width:'168px' }}>
          
        </Box>}
    {/* My Tasks Switch */}
    <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
            <FormControlLabel
              control={<Switch checked={showMyTasks} onChange={() => {
                setShowMyTasks(!showMyTasks);
                fetchTasks(); // silent refresh (no spinner)
                fetchUser();  // refresh user context
              }} />}
              label="My Bounties"
            />
          </Box></div>
         
          {/* Scrollable Card List */}
          <div
            style={{
              overflowY: "auto", 
              flex: 1, 
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
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" fontWeight={600}>{task.title}</Typography>
                      <Box
                        sx={{
                          backgroundColor: getMarkerColorValue(task.status || "open"),
                          color: "white",
                          borderRadius: "12px",
                          padding: "2px 8px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          textTransform: "capitalize",
                          display: "inline-block",
                        }}
                      >
                        {task.status === "in_progress" ? "In Progress" :
                         task.status === "in_review" ? "In Review" :
                         task.status === "completed" ? "Completed" :
                         task.status === "open" ? "Open" :
                         task.status || "Unknown"}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{addresses[task.id] || "Loading address..."}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{task.description}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </div>
        </div>
      </div>
      <Modal
      open={proofModal.open}
      onClose={() => setProofModal({ open: false, imgUrl: null, taskId: null })}
      aria-labelledby="proof-modal-title"
      aria-describedby="proof-modal-description"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "2px solid #000",
          boxShadow: 24,
          p: 4,
          width: "auto",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          borderRadius: "12px",
        }}
      >
        <Typography id="proof-modal-title" variant="h6" component="h2" fontWeight="bold">
          Verification Proof
        </Typography>

        {/* Image Display Section */}
        <Box
          sx={{
            position: "relative",
            mt: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 250,
          }}
        >
          {!imageLoaded && (
            // 🔄 Animated Loader
            <Box
              sx={{
                height: 250,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(0,0,0,0.05)",
                borderRadius: "8px",
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 0.6 },
                  "50%": { opacity: 1 },
                  "100%": { opacity: 0.6 },
                },
              }}
            >
              <CircularProgress color="success" size={36} />
              <Typography variant="body2" sx={{ ml: 2, color: "text.secondary" }}>
                Loading proof...
              </Typography>
            </Box>
          )}

          {proofModal.imgUrl && (
            <img
              src={proofModal.imgUrl}
              alt="Proof"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // stop spinner if broken image
              style={{
                width: "100%",
                borderRadius: "8px",
                marginTop: "8px",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.5s ease-in-out",
                position: imageLoaded ? "relative" : "absolute",
              }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3, gap: 1 }}>
          <Button
            disableRipple
            disableTouchRipple
            onClick={() => handleConfirmVerification(proofModal.taskId)}
            variant="contained"
            color="success"
            sx={{ fontWeight: "bold", flex: 1 }}
          >
            Confirm
          </Button>
          <Button
            disableRipple
            disableTouchRipple
            onClick={() => setProofModal({ open: false, imgUrl: null, taskId: null })}
            variant="contained"
            color="error"
            sx={{ fontWeight: "bold", flex: 1 }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Modal>

    </>
  )
}
