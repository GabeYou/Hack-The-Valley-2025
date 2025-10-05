"use client";
import { Box, Typography, Button, Container } from "@mui/material";
import Header from "@/components/Header";
import Link from "next/link";

export default function Home() {
  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        background: "#d8ffb1",
      }}
    >
      {/* Header */}
      <Header />

      {/* Hero Section Overlay */}
      <Container
        maxWidth="lg"
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Title */}
        <Typography
          variant="h1"
          sx={{
            fontFamily: "Raleway, sans-serif",
            fontSize: { xs: "3rem", md: "6rem", lg: "8rem" },
            color: "rgba(0,0,0,0.8)",
            textAlign: "center",
            py: 2,
          }}
        >
          ECOBOUNTY
        </Typography>

        {/* CTA Button */}
        <Box sx={{ mt: 6 }}>
          <Button
            component={Link}
            href="/signup"
            variant="contained"
            sx={{
              bgcolor: "#16a34a", // green-600
              color: "white",
              fontFamily: "Raleway, sans-serif",
              fontSize: { xs: "1.5rem", md: "2rem" },
              px: 1,
              "&:hover": {
                bgcolor: "#15803d", // green-700
              },
              borderRadius: 2,
            }}
          >
            Start Your Eco Journey Today
          </Button>
        </Box>

        {/* Subtitle */}
        <Typography
          variant="h5"
          sx={{
            position: "absolute",
            bottom: 40,
            width: "100%",
            textAlign: "center",
            color: "rgba(0,0,0,0.7)",
            fontFamily: "Raleway, sans-serif",
            px: 2,
          }}
        >
          Take Action Today for a Cleaner Tomorrow.
        </Typography>
      </Container>
    </Box>
  );
}
