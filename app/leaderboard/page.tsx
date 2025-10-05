"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState<"bounties" | "money">("bounties");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();

        const fromCompleted = data.topCompleted.map((entry: any) => ({
          id: entry.user.id,
          name: entry.user.name || "Anonymous",
          avatar: "/placeholder-profile.jpg",
          bountiesCompleted: entry.completedCount,
          moneyEarned: 0,
        }));

        const fromEarned = data.topEarned.map((entry: any) => ({
          id: entry.user.id,
          name: entry.user.name || "Anonymous",
          avatar: "/placeholder-profile.jpg",
          bountiesCompleted: 0,
          moneyEarned: entry.totalEarned,
        }));

        const mergedMap = new Map<string, any>();
        [...fromCompleted, ...fromEarned].forEach((e) => {
          if (!mergedMap.has(e.id)) {
            mergedMap.set(e.id, e);
          } else {
            const prev = mergedMap.get(e.id);
            mergedMap.set(e.id, {
              ...prev,
              bountiesCompleted: prev.bountiesCompleted + e.bountiesCompleted,
              moneyEarned: prev.moneyEarned + e.moneyEarned,
            });
          }
        });

        setEntries(Array.from(mergedMap.values()));
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case "bounties":
        return b.bountiesCompleted - a.bountiesCompleted;
      case "money":
        return b.moneyEarned - a.moneyEarned;
      default:
        return 0;
    }
  });

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 64px)",
          background: "#d8ffb1",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left: Leaderboard (scrollable) */}
        <Box
          sx={{
            flex: 1,
            maxWidth: "900px",
            mx: "auto",
            mt: "64px",
            px: 2,
            mb: 8,
            zIndex: 1,
            position: "relative",
            overflowY: "auto", // makes leaderboard scrollable
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: "bold",
              textAlign: "center",
              color: "#171717",
              paddingTop: "8px",
            }}
          >
            Leaderboard
          </Typography>

          <FormControl sx={{ mb: 3, minWidth: 200, backgroundColor: "white" }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="bounties">Bounties Completed</MenuItem>
              <MenuItem value="money">Money Earned</MenuItem>
            </Select>
          </FormControl>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#d8ffb1" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Bounties Completed
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Money Earned
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sortedEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      hover
                      sx={{
                        backgroundColor:
                          index % 2 === 0 ? "#f0fff0" : "white",
                        transition: "0.3s",
                        "&:hover": { backgroundColor: "#d8ffb1" },
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Avatar
                          src={entry.avatar}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Typography>{entry.name}</Typography>
                      </TableCell>
                      <TableCell>{entry.bountiesCompleted}</TableCell>
                      <TableCell>${entry.moneyEarned}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Right: SVG fixed */}
        <Box
          component="img"
          src="/leaderboard.svg" // replace with your SVG file
          alt="Decoration"
          sx={{
            flexShrink: 0,
            width: "500px",
            objectFit: "contain",
            alignSelf: "center",
            position: "sticky", // stays in place while scrolling leaderboard
            top: "64px",
            height: "calc(100vh - 64px)",
            opacity: 0.8,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      </Box>
    </>
  );
}
