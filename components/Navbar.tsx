"use client";
import React from "react";
import Link from "next/link";
import { AppBar, Toolbar, Box, Typography, Avatar } from "@mui/material";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";

export default function Navbar() {
  const links = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bounties", href: "/bounties" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <AppBar position="sticky" color="default" elevation={3}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", height: 64 }}>
        {/* Left side: Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EnergySavingsLeafIcon sx={{ color: "green", fontSize: 32 }} />
          <Typography
            component={Link}
            href="/"
            sx={{
              fontWeight: "bold",
              color: "black",
              textDecoration: "none",
              cursor: "pointer",
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
                color: "text.primary",
                textDecoration: "none",
                fontWeight: 500,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline", color: "green" },
              }}
            >
              {link.label}
            </Typography>
          ))}

          {/* Placeholder Profile Avatar */}
          <Avatar
            alt="Profile"
            src="/placeholder-profile.jpg"
            component={Link}
            href="/profile"
            sx={{ width: 32, height: 32, cursor: "pointer" }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
