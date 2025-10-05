'use client'

import React, { useState } from "react";
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
} from "@mui/material";

// Mock leaderboard data
const mockEntries = [
  {
    id: 1,
    name: "Alice",
    avatar: "/placeholder-profile.jpg",
    bountiesCompleted: 10,
    moneyEarned: 100,
    peopleHelped: 10,
    points: 100,
  },
  {
    id: 2,
    name: "Bob",
    avatar: "/placeholder-profile.jpg",
    bountiesCompleted: 20,
    moneyEarned: 300,
    peopleHelped: 6,
    points: 90,
  },
  {
    id: 3,
    name: "Charlie",
    avatar: "/placeholder-profile.jpg",
    bountiesCompleted: 15,
    moneyEarned: 600,
    peopleHelped: 10,
    points: 150,
  },
  {
    id: 4,
    name: "David",
    avatar: "/placeholder-profile.jpg",
    bountiesCompleted: 5,
    moneyEarned: 200,
    peopleHelped: 4,
    points: 70,
  },
];

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState<"points" | "bounties" | "money" | "helped">("points");

  // Sort entries based on selected metric
  const sortedEntries = [...mockEntries].sort((a, b) => {
    switch (sortBy) {
      case "points":
        return b.points - a.points;
      case "bounties":
        return b.bountiesCompleted - a.bountiesCompleted;
      case "money":
        return b.moneyEarned - a.moneyEarned;
      case "helped":
        return b.peopleHelped - a.peopleHelped;
      default:
        return 0;
    }
  });

  return (
    <div>
      <Navbar />

      <Box
        sx={{
          maxWidth: "900px",
          mx: "auto",
          mt: "64px", // push down below navbar
          px: 2,
          mb: 8,
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

        {/* Sorting Dropdown */}
        <FormControl sx={{ mb: 3, minWidth: 200, backgroundColor: "white" }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <MenuItem value="points">Points</MenuItem>
            <MenuItem value="bounties">Bounties Completed</MenuItem>
            <MenuItem value="money">Money Earned</MenuItem>
            <MenuItem value="helped">People Helped</MenuItem>
          </Select>
        </FormControl>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 5,
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#d8ffb1" }}>
                <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Points</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Bounties Completed</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Money Earned</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>People Helped</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedEntries.map((entry, index) => (
                <TableRow
                  key={entry.id}
                  hover
                  sx={{
                    backgroundColor: index % 2 === 0 ? "#f0fff0" : "white",
                    transition: "0.3s",
                    "&:hover": { backgroundColor: "#d8ffb1" },
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={entry.avatar} sx={{ width: 32, height: 32 }} />
                    <Typography>{entry.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>{entry.points}</TableCell>
                  <TableCell>{entry.bountiesCompleted}</TableCell>
                  <TableCell>${entry.moneyEarned}</TableCell>
                  <TableCell>{entry.peopleHelped}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
}
