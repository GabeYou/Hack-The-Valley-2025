"use client";
import React from "react";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Box, Typography, Paper, Grid } from "@mui/material";

// Import MUI icons
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShieldIcon from '@mui/icons-material/Shield';
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";

import { BarChart } from '@mui/x-charts/BarChart';

export default function DashboardPage() {

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch("/api/wallet", {
          method: "GET",
          credentials: "include", // <-- important if token is stored in cookies
        });

        if (!res.ok) {
          throw new Error("Failed to fetch wallet");
        }

        const data = await res.json();
        setWalletBalance(data.walletBalance);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWallet();
  }, []);

  // Second row stats
  const stats = [
    {
      label: "People Helped",
      value: "128",
      gradient: "linear-gradient(135deg, #a8e6cf, #dcedc1)",
      icon: <GroupsIcon sx={{ fontSize: 40, color: "#2e7d32", mb: 1 }} />, // dark green
    },
    {
      label: "Wallet Balance",
      value: walletBalance !== null ? `${walletBalance}` : "Loading...",
      gradient: "linear-gradient(135deg, #ffd3b6, #ffaaa5)",
      icon: <AssuredWorkloadIcon sx={{ fontSize: 40, color: "#ef6c00", mb: 1 }} />, // orange
    },
    {
      label: "Bounties Completed",
      value: "18",
      gradient: "linear-gradient(135deg, #ffaaa5, #ff8b94)",
      icon: <CheckCircleIcon sx={{ fontSize: 40, color: "#2e7d32", mb: 1 }} />, // green
    },
    {
      label: "Leaderboard Rank",
      value: "5",
      gradient: "linear-gradient(135deg, #dcedc1, #a8e6cf)",
      icon: <LeaderboardIcon sx={{ fontSize: 40, color: "#1565c0", mb: 1 }} />, // blue
    },
  ];

  // Badges for top row
  const topRowBadges = ["🌱", "💧", "☀️", "🌍", "🌸", "🔥"];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "linear-gradient(to bottom right, #e0f2f1, #f1f8e9)",
      }}
    >
      <Navbar />

      <Box sx={{ p: 4 }}>
        <Typography
          variant="h4"
          sx={{ mb: 4, color: "green.900", fontWeight: "bold" }}
        >
          Dashboard
        </Typography>

        {/* Row 1: Custom Top Row */}
        <Grid component="div" container spacing={4} sx={{ mb: 4 }}>
          {/* Box 1: Open Bounties Near You */}
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
            <Paper
              sx={{
                p: 4,
                flex: 1,
                borderRadius: 3,
                textAlign: "center",
                bgcolor: "linear-gradient(135deg, #e0f7fa, #b2ebf2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.03)" },
              }}
            >
              <LocationOnIcon sx={{ fontSize: 40, color: "#1565c0", mb: 1 }} /> {/* blue */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: "green.900" }}>
                Open Bounties Near You
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", color: "green.800" }}>12</Typography>
            </Paper>
          </Grid>

          {/* Box 2: Amount to be Earned */}
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
            <Paper
              sx={{
                p: 4,
                flex: 1,
                borderRadius: 3,
                textAlign: "center",
                bgcolor: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.03)" },
              }}
            >
              <AttachMoneyIcon sx={{ fontSize: 40, color: "#ef6c00", mb: 1 }} /> {/* orange */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: "green.900" }}>
                EcoBounty Money Claimed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", color: "green.800" }}>$1,200</Typography>
            </Paper>
          </Grid>

          {/* Box 3: Top Bounty Hunter Stats */}
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
            <Paper
              sx={{
                p: 4,
                flex: 1,
                borderRadius: 3,
                textAlign: "center",
                bgcolor: "linear-gradient(135deg, #f1f8e9, #dcedc1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.03)" },
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 40, color: "#f9a825", mb: 1 }} /> {/* gold */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: "green.900" }}>
                Top Bounty Hunter
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", color: "green.800" }}>Alex</Typography>
            </Paper>
          </Grid>

          {/* Box 4: Recent Badges */}
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                bgcolor: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
                boxShadow: "none",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.03)" },
              }}
            >
              {/* New Badge Icon on top */}
              <ShieldIcon sx={{ fontSize: 40, color: "#ad1457", mb: 1 }} /> {/* pink */}
              <Typography variant="h6" sx={{ color: "#ad1457", mb: 2, fontWeight: 500 }}>
                Recent Badges
              </Typography>
              <Grid component="div" container spacing={1} justifyContent="center">
                {topRowBadges.map((badge, idx) => (
                  <Grid component="div" size="grow" key={idx}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#fce4ec",
                        borderRadius: "50%",
                        border: "2px solid black",
                        fontSize: 24,
                      }}
                    >
                      {badge}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Row 2: Stats Cards */}
        <Grid component="div" container spacing={4}>
          {stats.map((stat) => (
            <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }} key={stat.label} sx={{ display: "flex" }}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: stat.gradient,
                  borderRadius: 3,
                  flex: 1,
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.03)" },
                  boxShadow: "none",
                }}
              >
                {stat.icon}
                <Typography variant="h6" sx={{ color: "green.900", mb: 1, fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ color: "green.800", fontWeight: "bold" }}>
                  {stat.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Row 3: Graph */}
        <Grid component="div" container spacing={4} sx={{ mt: 4 }}>
          <Grid component="div" size={{ xs: 12 }}>
          <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                flex: 1,
                textAlign: "center",
                boxShadow: "none",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Monthly Bounties Completed
              </Typography>
              <BarChart
                xAxis={[{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }]}
                series={[
                  {
                    data: [2, 5, 3, 7, 4, 3, 1, 2, 6, 7, 2, 5],
                  },
                ]}
                width={500}
                height={300}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
