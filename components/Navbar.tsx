"use client";
import React, { useState } from "react";
import Link from "next/link";
import { AppBar, Toolbar, Box, Typography, Avatar, IconButton } from "@mui/material";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ProfileModal from "./ProfileModal";

function logout() {
  document.cookie = "token=; path=/; max-age=0";
  window.location.href = "/login"; // redirect after logout
}

export default function Navbar() {
  const [openProfile, setOpenProfile] = useState(false);
  const links = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bounties", href: "/bounties" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{ backgroundColor: "white", color: "black" }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", height: 64 }}>
        {/* Left side: Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            disableRipple
            sx={{
              p: 0,
              "&:hover": {
                animation: "rotate-shake 0.6s ease-in-out forwards",
              },
              "@keyframes rotate-shake": {
                "0%": { transform: "rotate(0deg)" },
                "15%": { transform: "rotate(-15deg)" },
                "30%": { transform: "rotate(15deg)" },
                "45%": { transform: "rotate(-10deg)" },
                "60%": { transform: "rotate(10deg)" },
                "75%": { transform: "rotate(-5deg)" },
                "100%": { transform: "rotate(0deg)" },
              },
            }}
          >
            <EnergySavingsLeafIcon
              fontSize="large"
              sx={{ color: "green" }} // Tailwind green-600
            />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              fontSize: "1.5rem",
            }}
          >
            EcoBounty
          </Typography>
        </Box>

        {/* Right side: Links + Profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {links.map((link) => (
            <Typography
              key={link.label}
              component={Link}
              href={link.href}
              sx={{
                color: "#171717",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "1rem",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline", color: "#16a34a" },
              }}
            >
              {link.label}
            </Typography>
          ))}

          <Avatar
            alt="Profile"
            src="/placeholder-profile.jpg"
            onClick={() => setOpenProfile(true)}
            sx={{ width: 32, height: 32, cursor: "pointer" }}
          />
          <Box>
            <IconButton
              onClick={() => logout()}
              disableRipple
              sx={{ p: 0}}
            >
              <LogoutIcon
                fontSize="large"
                sx={{ color: "black" }} // Tailwind green-600
              />
            </IconButton>
          </Box>
        </Box>
      </Toolbar>
      {/* Modal lives at navbar level so it overlays current page without navigation */}
      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} />
    </AppBar>
  );
}
