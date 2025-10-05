"use client";
import { Box, Typography, Button, Container } from "@mui/material";
import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        background: "#d8ffb1",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Header />

      {/* Background SVG */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "80%", md: "60%", lg: "50%" },
          height: "auto",
          zIndex: 0,
          opacity: 0.15,
        }}
      >
        <Image
          src="/forest-bro.svg"
          alt="Forest Illustration"
          width={800}
          height={800}
          style={{ width: "100%", height: "auto" }}
        />
      </Box>

      {/* Foreground Content */}
      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // vertical centering
          alignItems: "center",
          textAlign: "center",
          gap: 4,
        }}
      >
        {/* Title + Subtitle */}
        <Box>
          <Typography
            variant="h1"
            sx={{
              fontFamily: "Raleway, sans-serif",
              fontSize: { xs: "3rem", md: "6rem", lg: "7rem" },
              color: "rgba(0,0,0,0.85)",
            }}
          >
            ECOBOUNTY
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 1,
              color: "rgba(0,0,0,0.7)",
              fontFamily: "Raleway, sans-serif",
            }}
          >
            Take Action Today for a Cleaner Tomorrow.
          </Typography>
        </Box>
      {/* CTA Button at bottom */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pb: 6,
          zIndex: 1,
        }}
      >
        <Button
          component={Link}
          href="/signup"
          variant="contained"
          sx={{
            bgcolor: "#16a34a",
            color: "white",
            fontFamily: "Raleway, sans-serif",
            fontSize: "1rem",
            px: 5,
            "&:hover": { bgcolor: "#15803d" },
            borderRadius: 2,
          }}
        >
          Start Your Eco Journey Today
        </Button>
      </Box>
      </Container>
    </Box>
  );
}
