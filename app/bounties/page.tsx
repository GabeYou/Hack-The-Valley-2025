"use client"

import { useEffect, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api"

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
    fetch("/api/bounties", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Unauthorized – please log in")
        }
        return res.json()
      })
      .then((data) => {
        setBounties(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])
  
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
    height: "100vh",
  }

  const cleanMapStyle = [
    { featureType: "poi", stylers: [{ visibility: "off" }] }, // hide points of interest
    { featureType: "transit", stylers: [{ visibility: "off" }] }, // hide transit
    // { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }, // hide road icons
    { featureType: "administrative", stylers: [{ visibility: "off" }] }, // hide administrative boundaries
    { featureType: "landscape", stylers: [{ visibility: "simplified" }] }, // simplify landscape
    { featureType: "water", stylers: [{ visibility: "simplified" }] }, // simplify water
    // { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] }, // hide all labels
  ]

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
    <div style={{maxWidth:'66%'}}><GoogleMap
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
  </GoogleMap></div>
  </div>

  )
}
